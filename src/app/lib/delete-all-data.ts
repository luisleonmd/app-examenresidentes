'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"

const prisma = new PrismaClient()

export async function deleteAllCategoriesAndQuestions() {
    const session = await auth()

    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    try {
        // Delete all questions first (foreign key constraint)
        const deletedQuestions = await prisma.question.deleteMany({})

        // Then delete all categories
        const deletedCategories = await prisma.questionCategory.deleteMany({})

        return {
            success: true,
            deletedQuestions: deletedQuestions.count,
            deletedCategories: deletedCategories.count
        }
    } catch (error) {
        console.error("Failed to delete all data:", error)
        return { success: false, error: "Error al eliminar los datos" }
    }
}
