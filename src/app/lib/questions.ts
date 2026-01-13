'use server'

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

const prisma = new PrismaClient()

export type QuestionOption = {
    id: string
    text: string
    is_correct: boolean
}

export async function getCategories() {
    try {
        return await prisma.questionCategory.findMany({
            include: {
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: { name: 'asc' }
        })
    } catch (error) {
        throw new Error("Failed to fetch categories")
    }
}

export async function getQuestions(categoryId?: string) {
    try {
        const whereClause: any = {
            status: 'PUBLISHED'
        }

        if (categoryId && categoryId !== 'all') {
            whereClause.category_id = categoryId
        }

        const questions = await prisma.question.findMany({
            where: whereClause,
            include: {
                category: true,
                author: {
                    select: { nombre: true }
                }
            },
            orderBy: { created_at: 'desc' }
        })
        return questions
    } catch (error) {
        console.error("Failed to fetch questions:", error)
        throw new Error("Failed to fetch questions")
    }
}

export async function createQuestion(data: any) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        await prisma.question.create({
            data: {
                text: data.text,
                image_url: data.image_url || null,
                explanation: data.explanation,
                options: JSON.stringify(data.options),
                category_id: data.category_id,
                author_id: session.user.id,
                status: 'PUBLISHED', // Default to published for valid questions
                version: 1
            }
        })

        revalidatePath('/dashboard/questions')
        return { success: true }
    } catch (error) {
        console.error("Failed to create question:", error)
        return { success: false, error: "Error al crear la pregunta." }
    }
}

export async function deleteQuestion(id: string) {
    try {
        await prisma.question.update({
            where: { id },
            data: { status: 'DEPRECATED' }
        })
        revalidatePath('/dashboard/questions')
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al eliminar" }
    }
}

import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function updateQuestion(formData: FormData) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COORDINADOR' && session.user.role !== 'PROFESOR')) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const id = formData.get('id') as string
        const text = formData.get('text') as string
        const explanation = formData.get('explanation') as string
        const categoryId = formData.get('category_id') as string
        const optionsJson = formData.get('options') as string
        const file = formData.get('file') as File | null
        const removeImage = formData.get('remove_image') === 'true'

        if (!id || !text || !categoryId || !optionsJson) {
            return { success: false, error: "Faltan campos requeridos" }
        }

        // Handle Image Upload
        let imageUrl = undefined // Undefined means "don't update" in Prisma update
        if (removeImage) {
            imageUrl = null
        }

        if (file && file.size > 0) {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Ensure directory exists
            const uploadDir = join(process.cwd(), "public/uploads/questions")
            await mkdir(uploadDir, { recursive: true })

            // Create unique filename
            const filename = `update-${id}-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
            const filepath = join(uploadDir, filename)

            await writeFile(filepath, buffer)
            imageUrl = `/uploads/questions/${filename}`
        }

        await prisma.question.update({
            where: { id },
            data: {
                text,
                explanation,
                category_id: categoryId,
                options: optionsJson,
                ...(imageUrl !== undefined ? { image_url: imageUrl } : {})
            }
        })

        revalidatePath('/dashboard/questions')
        revalidatePath('/dashboard/categories')
        return { success: true }
    } catch (error) {
        console.error("Failed to update question:", error)
        return { success: false, error: "Error al actualizar la pregunta" }
    }
}

export async function updateCategory(id: string, name: string) {
    const { auth } = await import("@/auth")
    const session = await auth()

    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    if (!name || name.trim().length === 0) {
        return { success: false, error: "El nombre de la categoría es requerido" }
    }

    try {
        // Check if name already exists (excluding current category)
        const existing = await prisma.questionCategory.findFirst({
            where: {
                name: name.trim(),
                NOT: { id }
            }
        })

        if (existing) {
            return { success: false, error: "Ya existe una categoría con ese nombre" }
        }

        await prisma.questionCategory.update({
            where: { id },
            data: { name: name.trim() }
        })

        revalidatePath('/dashboard/categories')
        revalidatePath('/dashboard/questions')
        return { success: true }
    } catch (error) {
        console.error("Failed to update category:", error)
        return { success: false, error: "Error al actualizar la categoría" }
    }
}

export async function mergeCategoryInto(sourceCategoryId: string, targetCategoryId: string) {
    const { auth } = await import("@/auth")
    const session = await auth()

    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    if (sourceCategoryId === targetCategoryId) {
        return { success: false, error: "No puedes mover una categoría a sí misma" }
    }

    try {
        // Get both categories
        const [sourceCategory, targetCategory] = await Promise.all([
            prisma.questionCategory.findUnique({
                where: { id: sourceCategoryId },
                include: { _count: { select: { questions: true } } }
            }),
            prisma.questionCategory.findUnique({
                where: { id: targetCategoryId }
            })
        ])

        if (!sourceCategory || !targetCategory) {
            return { success: false, error: "Categoría no encontrada" }
        }

        const questionCount = sourceCategory._count.questions

        // Move all questions from source to target
        await prisma.question.updateMany({
            where: { category_id: sourceCategoryId },
            data: { category_id: targetCategoryId }
        })

        // Delete source category
        await prisma.questionCategory.delete({
            where: { id: sourceCategoryId }
        })

        revalidatePath('/dashboard/categories')
        revalidatePath('/dashboard/questions')

        return {
            success: true,
            message: `${questionCount} pregunta(s) movida(s) de "${sourceCategory.name}" a "${targetCategory.name}". Categoría "${sourceCategory.name}" eliminada.`
        }
    } catch (error) {
        console.error("Failed to merge category:", error)
        return { success: false, error: "Error al mover las preguntas" }
    }
}

export async function deleteAllCategories() {
    const { auth } = await import("@/auth")
    const session = await auth()

    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    try {
        // Check if there are any exam attempts
        const attemptsCount = await prisma.examAttempt.count()
        if (attemptsCount > 0) {
            return {
                success: false,
                error: "No se pueden eliminar las categorías porque existen intentos de examen registrados. Debes eliminar los intentos primero."
            }
        }

        // Delete all questions - this is necessary because of FK constraints if they are not cascade
        await prisma.question.deleteMany({})

        // Delete all categories
        const result = await prisma.questionCategory.deleteMany({})

        revalidatePath('/dashboard/categories')
        revalidatePath('/dashboard/questions')

        return {
            success: true,
            message: `Todas las categorías y sus preguntas han sido eliminadas. (${result.count} categorías)`
        }
    } catch (error) {
        console.error("Failed to delete all categories:", error)
        return { success: false, error: "Error al eliminar categorías. Puede haber datos relacionados (exámenes, intentos) que lo impiden." }
    }
}
