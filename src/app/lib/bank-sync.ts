'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { UnifiedQuestion, JSON_BANK_ROTATIONS } from "@/types/questions"

const prisma = new PrismaClient()

export async function syncQuestionBank(questions: UnifiedQuestion[]) {
    const session = await auth()
    
    // Only Coordinators can sync the master bank
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    try {
        let createdCount = 0
        let updatedCount = 0
        
        // Use a transaction for safety? We have potentially hundreds of questions.
        // Doing them sequentially or in batches is safer to avoid transaction timeouts.
        
        // 1. Pre-fetch existing categories to avoid constant lookups
        const categories = await prisma.questionCategory.findMany()
        const categoryMap = new Map(categories.map(c => [c.name, c.id]))

        for (const q of questions) {
            // Map the JSON rotation name to our DB Category name
            const targetCategoryName = JSON_BANK_ROTATIONS[q.rotation] || q.rotation
            
            // Get or create category
            let categoryId = categoryMap.get(targetCategoryName)
            if (!categoryId) {
                const newCat = await prisma.questionCategory.create({
                    data: { name: targetCategoryName }
                })
                categoryId = newCat.id
                categoryMap.set(targetCategoryName, categoryId)
            }

            // Build the text field (caso_clinico + pregunta)
            const fullText = `${q.clinical_case}\n\nPregunta: ${q.question}`

            // Prepare options JSON string
            const optionsJson = JSON.stringify(
                q.options.map((opt, index) => ({
                    id: String(index + 1),
                    text: opt.text,
                    is_correct: opt.is_correct
                }))
            )
            
            const existingQuestion = await prisma.question.findFirst({
                where: {
                    category_id: categoryId,
                    text: fullText
                }
            })

            if (existingQuestion) {
                // Update it
                await prisma.question.update({
                    where: { id: existingQuestion.id },
                    data: {
                        options: optionsJson,
                        explanation: q.explanation,
                        image_url: q.image_url,
                        source: "JSON_BANK"
                        // We do not change author or created_at
                    }
                })
                updatedCount++
            } else {
                // Create new
                await prisma.question.create({
                    data: {
                        text: fullText,
                        category_id: categoryId,
                        options: optionsJson,
                        explanation: q.explanation,
                        image_url: q.image_url,
                        author_id: session.user.id,
                        status: 'PUBLISHED',
                        source: "JSON_BANK"
                    }
                })
                createdCount++
            }
        }

        return { 
            success: true, 
            created: createdCount, 
            updated: updatedCount 
        }

    } catch (error: any) {
        console.error("Sync Bank Error:", error)
        return { success: false, error: `Error en sincronización: ${error.message}` }
    }
}
