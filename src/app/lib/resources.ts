'use server'

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const prisma = new PrismaClient()

export type ResourceType = 'DOCUMENT' | 'LINK' | 'ROTATION_IMAGE'

export async function createResource(formData: FormData) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COORDINADOR' && session.user.role !== 'PROFESOR')) {
        return { success: false, error: "No autorizado" }
    }

    try {
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        let type = formData.get('type') as string // Allow string to accept custom types
        const url = formData.get('url') as string
        const file = formData.get('file') as File | null

        let fileData = null
        let fileType = null
        let isSyllabusFile = false

        // Handle the custom "SYLLABUS" types from frontend
        if (type === 'SYLLABUS_FILE') {
            type = 'LINK' // Store as LINK so it shows in Temario section
            isSyllabusFile = true
        } else if (type === 'SYLLABUS_LINK') {
            type = 'LINK'
        }

        // Handle custom "DOCUMENT" types (File vs Link mode for Support Material)
        let isDocumentFile = true // Default to true for backward compatibility
        if (type === 'DOCUMENT_FILE') {
            type = 'DOCUMENT'
            isDocumentFile = true
        } else if (type === 'DOCUMENT_LINK') {
            type = 'DOCUMENT'
            isDocumentFile = false
        }

        // Logic for file processing
        // We need a file if:
        // 1. It is ROTATION_IMAGE
        // 2. It is SYLLABUS_FILE (Temario File)
        // 3. It is DOCUMENT (standard) AND it is flagged as a file (isDocumentFile)

        const needsFile = type === 'ROTATION_IMAGE' ||
            isSyllabusFile ||
            (type === 'DOCUMENT' && isDocumentFile)

        if (needsFile && file && file.size > 0) {
            // Limit file size to 20MB for DB storage (adjusted for server actions limit)
            if (file.size > 20 * 1024 * 1024) {
                return { success: false, error: "El archivo es demasiado grande. Máximo 20MB." }
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            fileData = buffer.toString('base64')
            fileType = file.type
        }

        // Logic for URL validation
        // Require URL if:
        // 1. It is LINK (Temario) AND NOT a file upload
        // 2. It is DOCUMENT (Support) AND NOT a file upload (Link mode)

        const needsUrl = (type === 'LINK' && !isSyllabusFile) ||
            (type === 'DOCUMENT' && !isDocumentFile)

        if (needsUrl && !url) {
            return { success: false, error: "La URL es requerida para enlaces." }
        }

        await prisma.studyResource.create({
            data: {
                title,
                description,
                type: type as ResourceType,
                url: needsUrl ? url : null,
                file_data: fileData,
                file_type: fileType
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Failed to create resource:", error)
        return { success: false, error: "Error al crear el recurso." }
    }
}

export async function deleteResource(id: string) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COORDINADOR')) {
        return { success: false, error: "No autorizado" }
    }

    try {
        await prisma.studyResource.delete({
            where: { id }
        })
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al eliminar" }
    }
}

export async function getResources() {
    try {
        return await prisma.studyResource.findMany({
            orderBy: { created_at: 'desc' }
        })
    } catch (error) {
        return []
    }
}
