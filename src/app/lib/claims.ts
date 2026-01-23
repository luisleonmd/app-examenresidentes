'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { createNotification } from "./notifications"

const prisma = new PrismaClient()

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function createClaim(formData: FormData) {
    const session = await auth()

    if (!session?.user) {
        return { success: false, error: "No has iniciado sesión." }
    }

    const attemptId = formData.get('attemptId') as string
    const questionId = formData.get('questionId') as string
    const justification = formData.get('justification') as string
    const bibliography = formData.get('bibliography') as string
    const file = formData.get('file') as File | null

    if (!attemptId || !questionId || !justification) {
        return { success: false, error: "Faltan campos requeridos." }
    }

    // Verify ownership and timeline
    const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: { exam: true }
    })

    if (!attempt || attempt.user_id !== session.user.id) {
        return { success: false, error: "No tienes permiso para realizar esta acción." }
    }

    const now = new Date()
    if (attempt.exam.claims_start && now < attempt.exam.claims_start) {
        return { success: false, error: `El periodo de reclamos inicia el ${attempt.exam.claims_start.toLocaleString()}` }
    }

    if (attempt.exam.claims_end && now > attempt.exam.claims_end) {
        return { success: false, error: `El periodo de reclamos finalizó el ${attempt.exam.claims_end.toLocaleString()}` }
    }

    if (attempt.status !== 'SUBMITTED') {
        return { success: false, error: "El examen debe estar finalizado para impugnar." }
    }

    // Check if already claimed
    const existing = await prisma.claim.findFirst({
        where: {
            attempt_id: attemptId,
            question_id: questionId
        }
    })

    if (existing) {
        return { success: false, error: "Ya has impugnado esta pregunta." }
    }

    try {
        const claim = await prisma.claim.create({
            data: {
                attempt_id: attemptId,
                question_id: questionId,
                justification: justification,
                bibliography: bibliography || "",
                status: 'PENDING'
            },
            include: {
                attempt: {
                    include: {
                        user: { select: { nombre: true } },
                        exam: { select: { title: true, created_by: true } }
                    }
                }
            }
        })

        // Handle File Upload
        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Ensure directory exists
            const uploadDir = join(process.cwd(), "public/uploads/claims")
            await mkdir(uploadDir, { recursive: true })

            // Create unique filename
            const filename = `${claim.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const filepath = join(uploadDir, filename)

            await writeFile(filepath, buffer)

            // Save attachment record
            await prisma.claimAttachment.create({
                data: {
                    claim_id: claim.id,
                    file_url: `/uploads/claims/${filename}`,
                    file_type: file.type || 'application/octet-stream'
                }
            })
        }

        // Notify professors and coordinators
        const professors = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'PROFESOR' },
                    { role: 'COORDINADOR' }
                ]
            },
            select: { id: true }
        })

        for (const prof of professors) {
            await createNotification(
                prof.id,
                'NEW_CLAIM',
                'Nuevo reclamo',
                `${claim.attempt.user.nombre} envió un reclamo en "${claim.attempt.exam.title}"`,
                `/dashboard/claims/${claim.id}`
            )
        }

        revalidatePath(`/dashboard/exams/take/${attemptId}/result`)
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, error: "Error al crear la impugnación." }
    }
}

export async function getClaims(status?: string) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COORDINADOR' && session.user.role !== 'PROFESOR')) {
        throw new Error("Unauthorized")
    }

    try {
        const claims = await prisma.claim.findMany({
            where: status ? { status } : {},
            include: {
                question: true,
                attempt: {
                    include: {
                        user: { select: { nombre: true, cedula: true } },
                        exam: { select: { title: true } }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })
        return claims
    } catch (e) {
        console.error(e)
        throw new Error("Failed to fetch claims")
    }
}

export async function updateClaimStatus(claimId: string, status: string, notes: string) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COORDINADOR' && session.user.role !== 'PROFESOR')) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // Get claim details for notification
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
            include: {
                attempt: {
                    include: {
                        user: true,
                        exam: { select: { title: true } }
                    }
                }
            }
        })

        if (!claim) {
            return { success: false, error: "Claim not found" }
        }

        await prisma.claim.update({
            where: { id: claimId },
            data: {
                status,
                resolution_notes: notes,
                resolved_by: session.user.id
            }
        })

        // Create notification for student
        const statusText = status === 'APPROVED' ? 'aprobado' : 'rechazado'
        await createNotification(
            claim.attempt.user_id,
            'CLAIM_RESOLVED',
            'Reclamo resuelto',
            `Tu reclamo del examen "${claim.attempt.exam.title}" ha sido ${statusText}`,
            `/dashboard/exams/take/${claim.attempt_id}/result`
        )

        revalidatePath('/dashboard/claims')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { success: false, error: "Error updating claim" }
    }
}

export async function getClaimDetail(claimId: string) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COORDINADOR' && session.user.role !== 'PROFESOR')) {
        throw new Error("Unauthorized")
    }

    try {
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
            include: {
                question: {
                    include: { category: true }
                },
                attempt: {
                    include: {
                        user: { select: { nombre: true, cedula: true } },
                        exam: { select: { title: true } }
                    }
                }
            }
        })

        if (!claim) return null

        // Fetch the specific answer
        const answer = await prisma.answer.findFirst({
            where: {
                attempt_id: claim.attempt_id,
                question_id: claim.question_id
            }
        })

        return { ...claim, answer }

    } catch (e) {
        console.error(e)
        throw new Error("Failed to fetch claim details")
    }
}
