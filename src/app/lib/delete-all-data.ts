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

export async function deleteOnlyAiQuestions() {
    const session = await auth()

    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    try {
        // Find all question IDs where source is JSON_BANK
        const aiQuestions = await prisma.question.findMany({
            where: { source: 'JSON_BANK' },
            select: { id: true }
        })
        const aiQuestionIds = aiQuestions.map(q => q.id)

        if (aiQuestionIds.length === 0) {
            return { success: true, deletedQuestions: 0 }
        }

        // 1. Delete Claim Attachments for AI questions
        await prisma.claimAttachment.deleteMany({
            where: {
                claim: {
                    question_id: { in: aiQuestionIds }
                }
            }
        })

        // 2. Delete Claims for AI questions
        await prisma.claim.deleteMany({
            where: {
                question_id: { in: aiQuestionIds }
            }
        })

        // 3. Delete Answers for AI questions
        await prisma.answer.deleteMany({
            where: {
                question_id: { in: aiQuestionIds }
            }
        })

        // 4. Delete the Questions themselves
        const deletedQuestions = await prisma.question.deleteMany({
            where: {
                id: { in: aiQuestionIds }
            }
        })

        return {
            success: true,
            deletedQuestions: deletedQuestions.count
        }
    } catch (error: any) {
        console.error("Failed to delete AI questions:", error)
        return { success: false, error: "Error al eliminar los casos clínicos de IA: " + error.message }
    }
}

