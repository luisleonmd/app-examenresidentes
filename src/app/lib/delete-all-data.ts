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
        // 1. Delete Claim Attachments
        await prisma.claimAttachment.deleteMany({})

        // 2. Delete Claims
        await prisma.claim.deleteMany({})

        // 3. Delete Answers
        await prisma.answer.deleteMany({})

        // 4. Delete Exam Attempts
        await prisma.examAttempt.deleteMany({})

        // 5. Delete Exam Profiles
        await prisma.examProfile.deleteMany({})

        // 6. Delete Exams
        await prisma.exam.deleteMany({})

        // 7. Delete Questions
        const deletedQuestions = await prisma.question.deleteMany({})

        // 8. Delete Question Categories
        const deletedCategories = await prisma.questionCategory.deleteMany({})

        return {
            success: true,
            deletedQuestions: deletedQuestions.count,
            deletedCategories: deletedCategories.count
        }
    } catch (error: any) {
        console.error("Failed to delete all data:", error)
        return { success: false, error: "Error al eliminar los datos: " + error.message }
    }
}
