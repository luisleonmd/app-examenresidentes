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

        // Logic for file processing
        const needsFile = (type !== 'LINK' && type !== 'ROTATION_IMAGE') || isSyllabusFile

        if (needsFile && file && file.size > 0) {
            // Limit file size to 5MB for DB storage
            if (file.size > 5 * 1024 * 1024) {
                return { success: false, error: "El archivo es demasiado grande. Máximo 5MB para almacenamiento interno." }
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            fileData = buffer.toString('base64')
            fileType = file.type
        }

        // Logic for URL validation
        // Require URL only if it is a LINK/SYLLABUS_LINK and NOT a file upload
        if (type === 'LINK' && !isSyllabusFile && !url) {
            return { success: false, error: "La URL es requerida para enlaces." }
        }

        await prisma.studyResource.create({
            data: {
                title,
                description,
                type: type as ResourceType,
                url: (type === 'LINK' && !isSyllabusFile) ? url : null,
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
