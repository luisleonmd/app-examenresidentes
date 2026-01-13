'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function deleteCategory(categoryId: string) {
    const session = await auth()

    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    try {
        // First, delete all questions in this category
        await prisma.question.deleteMany({
            where: { category_id: categoryId }
        })

        // Then delete the category
        await prisma.questionCategory.delete({
            where: { id: categoryId }
        })

        revalidatePath('/dashboard/categories')
        revalidatePath('/dashboard/questions')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete category:", error)
        return { success: false, error: "Error al eliminar la categoría" }
    }
}
