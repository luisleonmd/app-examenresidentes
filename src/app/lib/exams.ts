'use server'

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { calculateQuestionDistribution } from "./exam-config"

const prisma = new PrismaClient()

export async function getCourses() {
    try {
        return await prisma.course.findMany({ where: { active: true } })
    } catch (error) {
        throw new Error("Failed to fetch courses")
    }
}

// Folders
export async function createExamFolder(name: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }
    try {
        await prisma.examFolder.create({ data: { name } })
        revalidatePath('/dashboard/exams')
        return { success: true }
    } catch (e) {
        return { success: false, error: "Failed to create folder" }
    }
}

export async function updateExamFolder(id: string, name: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }
    try {
        await prisma.examFolder.update({
            where: { id },
            data: { name }
        })
        revalidatePath('/dashboard/exams')
        return { success: true }
    } catch (e) {
        return { success: false, error: "Failed to update folder" }
    }
}

export async function deleteExamFolder(id: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }
    try {
        // Check if has exams? cascade delete exams? 
        // Safe approach: only if empty or cascade. 
        // Prisma relies on manual cascade if not defined in schema with onDelete: Cascade. 
        // Let's assume we want to delete exams in it too? 
        // Getting complex. Let's strict: Only if empty or move exams to root (null).
        // For simplicity requested: "Group exams".
        // Let's just delete the folder and exams become orphans or we cascade delete.
        // Update schema to SetNull? or just delete folder and keep exams with invalid ID? No.
        // Let's manually set folder_id to null for exams in this folder.
        await prisma.exam.updateMany({
            where: { folder_id: id },
            data: { folder_id: null }
        })
        await prisma.examFolder.delete({ where: { id } })

        revalidatePath('/dashboard/exams')
        return { success: true }
    } catch (e) {
        return { success: false, error: "Failed to delete folder" }
    }
}

export async function getExamFolders() {
    const session = await auth()
    const whereClause: any = {}

    if (session?.user?.role === 'RESIDENTE') {
        const enrollments = await prisma.enrollment.findMany({
            where: { user_id: session.user.id },
            select: { course_id: true }
        })
        const courseIds = enrollments.map(e => e.course_id)

        // Only show folders that have at least one exam visible to the resident
        whereClause.exams = {
            some: {
                OR: [
                    {
                        AND: [
                            {
                                OR: [
                                    { course_id: null },
                                    { course_id: { in: courseIds } }
                                ]
                            },
                            {
                                OR: [
                                    { profiles: { none: {} } },
                                    { profiles: { some: { user_id: session.user.id } } }
                                ]
                            }
                        ]
                    },
                    {
                        attempts: { some: { user_id: session.user.id } }
                    }
                ]
            }
        }
    }

    return await prisma.examFolder.findMany({
        where: whereClause,
        orderBy: [
            { rank: 'asc' },
            { created_at: 'desc' }
        ],
        include: { _count: { select: { exams: true } } }
    })
}

export async function moveFolder(folderId: string, direction: 'up' | 'down') {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // 1. Get all folders in current order
        const folders = await prisma.examFolder.findMany({
            orderBy: [
                { rank: 'asc' },
                { created_at: 'desc' }
            ]
        })

        const currentIndex = folders.findIndex(f => f.id === folderId)
        if (currentIndex === -1) return { success: false, error: "Folder not found" }

        // 2. Identify target index
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

        // Check bounds
        if (targetIndex < 0 || targetIndex >= folders.length) {
            return { success: true } // Already at top/bottom
        }

        // 3. Swap ranks
        // We'll normalize ranks to be their index first to ensure continuity, then swap.
        // Actually, just assigning index as rank for all is clean and self-healing.

        const folderA = folders[currentIndex]
        const folderB = folders[targetIndex]

        // Swap their positions in the array
        folders[currentIndex] = folderB
        folders[targetIndex] = folderA

        // Transaction to update all ranks (or just the two? All is safer to heal gaps)
        await prisma.$transaction(
            folders.map((folder, index) =>
                prisma.examFolder.update({
                    where: { id: folder.id },
                    data: { rank: index }
                })
            )
        )

        revalidatePath('/dashboard/exams')
        return { success: true }

    } catch (e) {
        console.error("Failed to move folder", e)
        return { success: false, error: "Failed to move folder" }
    }
}

export async function getExams(folderId?: string | null) {
    const session = await auth()
    try {
        // If Resident, filter by course enrollment
        const whereClause: any = {}

        // Folder filtering
        if (folderId !== undefined) {
            whereClause.folder_id = folderId
        } else {
            // If undefined (root view called without folder), maybe we want ALL or just Root? 
            // Usually UI handles "Root" by passing null. 
            // If we pass 'undefined', we might want *all* exams (for legacy view).
            // But for folders view, we likely want flat list if no folder structure used, or just root exams.
            // Let's support optional filter. If not passed, return all (backward compat).
        }
        // Actually, if we want "Folders View", `getExams` should probably return exams in the current folder (or root if null).

        if (session?.user?.role === 'RESIDENTE') {
            // 1. Get user enrollments
            const enrollments = await prisma.enrollment.findMany({
                where: { user_id: session.user.id },
                select: { course_id: true }
            })
            const courseIds = enrollments.map(e => e.course_id)

            // 2. Filter exams: Either no course (General) or enrolled course
            // AND either general exam (no specific profiles) or assigned to this user
            // 2. Filter exams: 
            // - Available now (Course/Assignment match)
            // - OR Previously attempted (History)
            whereClause.OR = [
                {
                    AND: [
                        {
                            OR: [
                                { course_id: null },
                                { course_id: { in: courseIds } }
                            ]
                        },
                        {
                            OR: [
                                { profiles: { none: {} } }, // General exam
                                { profiles: { some: { user_id: session.user.id } } } // Assigned to me
                            ]
                        }
                    ]
                },
                {
                    attempts: { some: { user_id: session.user.id } }
                }
            ]
        }

        const exams = await prisma.exam.findMany({
            where: whereClause,
            include: {
                course: true,
                creator: { select: { nombre: true } },
                profiles: {
                    include: {
                        user: { select: { nombre: true } }
                    }
                }
            },
            orderBy: { start_window: 'desc' }
        })

        // If user is logged in, fetch their attempts
        let attemptsMap = new Map()
        if (session?.user?.id) {
            const attempts = await prisma.examAttempt.findMany({
                where: {
                    user_id: session.user.id,
                    exam_id: { in: exams.map(e => e.id) }
                }
            })
            attempts.forEach(a => attemptsMap.set(a.exam_id, a))
        }

        return exams.map(exam => {
            const attempt = attemptsMap.get(exam.id)
            return {
                ...exam,
                userAttempt: attempt ? {
                    id: attempt.id,
                    status: attempt.status,
                    score: attempt.score
                } : null
            }
        })

    } catch (error) {
        console.error("Failed to fetch exams", error)
        throw new Error("Failed to fetch exams")
    }
}

export async function createExam(data: any) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const exam = await prisma.exam.create({
            data: {
                title: data.title,
                // If course_id is "general" or empty, store null or handle logic. 
                // For now, if provided use it, else null.
                course_id: data.course_id === 'general' ? null : data.course_id,
                folder_id: data.folder_id === 'root' ? null : data.folder_id,
                created_by: session.user.id,
                duration_minutes: parseInt(data.duration_minutes),
                start_window: data.start_window,
                end_window: data.end_window,
                claims_start: data.claims_start,
                claims_end: data.claims_end,
                total_questions: parseInt(data.total_questions),
                // Store categories as JSON
                categories: JSON.stringify(data.categories),
                rules: JSON.stringify({})
            }
        })

        // If a specific resident was selected, create an ExamProfile for them
        if (data.assigned_to_user_id && data.assigned_to_user_id !== 'all') {
            // Fetch category names to use utility
            const selectedCategories = await prisma.questionCategory.findMany({
                where: { id: { in: data.categories } },
                select: { id: true, name: true }
            })

            const distribution = calculateQuestionDistribution(parseInt(data.total_questions), selectedCategories)

            await prisma.examProfile.create({
                data: {
                    exam_id: exam.id,
                    user_id: data.assigned_to_user_id,
                    configuration: JSON.stringify(distribution)
                }
            })
        }

        revalidatePath('/dashboard/exams')
        return { success: true }
    } catch (error) {
        console.error("Failed to create exam", error)
        return { success: false, error: "Failed to create exam" }
    }
}
export async function deleteExam(examId: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // Delete dependencies first using a transaction or manually
        // We need to delete Claims, Answers, ExamAttempts first
        await prisma.$transaction(async (tx) => {
            // Find all attempts
            const attempts = await tx.examAttempt.findMany({
                where: { exam_id: examId },
                select: { id: true }
            })
            const attemptIds = attempts.map(a => a.id)

            if (attemptIds.length > 0) {
                // Find claims to delete attachments first
                const claims = await tx.claim.findMany({
                    where: { attempt_id: { in: attemptIds } },
                    select: { id: true }
                })
                const claimIds = claims.map(c => c.id)

                if (claimIds.length > 0) {
                    await tx.claimAttachment.deleteMany({
                        where: { claim_id: { in: claimIds } }
                    })
                }

                // Delete Claims linked to these attempts
                await tx.claim.deleteMany({
                    where: { attempt_id: { in: attemptIds } }
                })

                // Delete Answers linked to these attempts
                await tx.answer.deleteMany({
                    where: { attempt_id: { in: attemptIds } }
                })

                // Delete Attempts
                await tx.examAttempt.deleteMany({
                    where: { exam_id: examId }
                })
            }

            // Delete Exam Profiles (Assigned Users)
            await tx.examProfile.deleteMany({
                where: { exam_id: examId }
            })

            // Finally delete the exam
            await tx.exam.delete({
                where: { id: examId }
            })
        })

        revalidatePath('/dashboard/exams')
        return { success: true }
    } catch (error: any) {
        console.error("Delete exam error:", error)
        return {
            success: false,
            error: `Error: ${error.message || "Desconocido"} (Código: ${error.code || 'N/A'})`
        }
    }
}

export async function deleteExamsByTitle(title: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Find ALL exams with this title
            const exams = await tx.exam.findMany({
                where: { title: title },
                select: { id: true }
            })
            const examIds = exams.map(e => e.id)

            if (examIds.length === 0) return

            // 1. Attempts
            const attempts = await tx.examAttempt.findMany({
                where: { exam_id: { in: examIds } },
                select: { id: true }
            })
            const attemptIds = attempts.map(a => a.id)

            if (attemptIds.length > 0) {
                // Attachments
                const claims = await tx.claim.findMany({
                    where: { attempt_id: { in: attemptIds } },
                    select: { id: true }
                })
                const claimIds = claims.map(c => c.id)

                if (claimIds.length > 0) {
                    await tx.claimAttachment.deleteMany({
                        where: { claim_id: { in: claimIds } }
                    })
                }

                // Claims, Answers, Attempts
                await tx.claim.deleteMany({ where: { attempt_id: { in: attemptIds } } })
                await tx.answer.deleteMany({ where: { attempt_id: { in: attemptIds } } })
                await tx.examAttempt.deleteMany({ where: { exam_id: { in: examIds } } })
            }

            // 2. Profiles (Assignments)
            await tx.examProfile.deleteMany({
                where: { exam_id: { in: examIds } }
            })

            // 3. Exams
            await tx.exam.deleteMany({
                where: { id: { in: examIds } }
            })
        })

        revalidatePath('/dashboard/exams')
        return { success: true }
    } catch (error: any) {
        console.error("Bulk delete exam error:", error)
        return {
            success: false,
            error: `Error: ${error.message || "Desconocido"}`
        }
    }
}
