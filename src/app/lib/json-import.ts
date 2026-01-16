'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

interface JSONQuestion {
    text: string
    explanation?: string
    image_url?: string
    category: string
    options: Array<{
        text: string
        is_correct: boolean
    }>
}

export async function importQuestionsJSON(
    jsonData: string,
    options: { overrideCategoryId?: string, newCategoryName?: string } = {}
) {
    const session = await auth()
    if (!session?.user || session.user.role === 'RESIDENTE') {
        return { success: false, error: "No autorizado" }
    }

    try {
        // Parse JSON
        const rawData = JSON.parse(jsonData)
        let questions: JSONQuestion[] = []

        if (!Array.isArray(rawData)) {
            return { success: false, error: "El JSON debe ser un array de preguntas" }
        }

        // Normalize Data: Support both formats (Standard vs Legacy/Custom)
        questions = rawData.map((item: any) => {
            // Check if it matches the "Legacy/Custom" format
            if (item.pregunta && item.opciones && !Array.isArray(item.opciones)) {

                // Convert options object {"A": "...", "B": "..."} to array
                const optsArray = Object.entries(item.opciones).map(([key, val]) => ({
                    text: String(val),
                    is_correct: item.respuesta_correcta === key
                }))

                return {
                    text: item.pregunta,
                    explanation: item.justificacion_correcta || item.feedback_incorrecto?.[item.respuesta_correcta],
                    category: item.tema || item.curso_rotacion || "General",
                    options: optsArray,
                    image_url: undefined
                }
            }

            // Return as is (Standard format) or incomplete object to be caught by validation
            return item as JSONQuestion
        })

        if (!Array.isArray(questions)) {
            return { success: false, error: "El JSON debe ser un array de preguntas" } // Redundant but safe
        }

        let importedCount = 0
        const errors: string[] = []

        // Pre-resolve category if override is active
        let targetCategoryId: string | null = null

        if (options.newCategoryName) {
            // Create new category
            try {
                const newCat = await prisma.questionCategory.create({
                    data: { name: options.newCategoryName.trim() }
                })
                targetCategoryId = newCat.id
            } catch (e) {
                return { success: false, error: "Error al crear la nueva categoría. Posible duplicado." }
            }
        } else if (options.overrideCategoryId && options.overrideCategoryId !== "json") {
            // Use existing category
            targetCategoryId = options.overrideCategoryId
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i]

            // Validate question structure
            // If we have a targetCategory, we don't strictly need q.category in JSON
            if (!q.text || (!q.category && !targetCategoryId) || !q.options || !Array.isArray(q.options)) {
                errors.push(`Pregunta ${i + 1}: Faltan campos requeridos (text, category*, options).`)
                continue
            }

            if (q.options.length < 2) {
                errors.push(`Pregunta ${i + 1}: Debe tener al menos 2 opciones`)
                continue
            }

            const hasCorrectAnswer = q.options.some(opt => opt.is_correct)
            if (!hasCorrectAnswer) {
                errors.push(`Pregunta ${i + 1}: Debe tener al menos una respuesta correcta`)
                continue
            }

            try {
                let categoryIdToUse = targetCategoryId

                // If no override, use JSON category
                if (!categoryIdToUse) {
                    // Find or create category
                    let category = await prisma.questionCategory.findFirst({
                        where: { name: q.category }
                    })

                    if (!category) {
                        category = await prisma.questionCategory.create({
                            data: { name: q.category }
                        })
                    }
                    categoryIdToUse = category.id
                }

                // Format options with IDs
                const formattedOptions = q.options.map((opt, idx) => ({
                    id: String.fromCharCode(65 + idx), // A, B, C, D...
                    text: opt.text,
                    is_correct: opt.is_correct
                }))

                // Create question
                await prisma.question.create({
                    data: {
                        text: q.text,
                        explanation: q.explanation || null,
                        image_url: q.image_url || null,
                        options: JSON.stringify(formattedOptions),
                        category_id: categoryIdToUse!,
                        author_id: session.user.id,
                        status: 'PUBLISHED',
                        version: 1
                    }
                })

                importedCount++
            } catch (err) {
                errors.push(`Pregunta ${i + 1}: Error al importar - ${err}`)
            }
        }

        revalidatePath('/dashboard/questions')
        revalidatePath('/dashboard/categories')

        if (errors.length > 0) {
            return {
                success: importedCount > 0, // Only success if at least one imported
                imported: importedCount,
                errors: errors,
                message: importedCount > 0
                    ? `Importadas ${importedCount} preguntas. ${errors.length} errores encontrados.`
                    : `No se pudieron importar preguntas. ${errors.length} errores encontrados.`
            }
        }

        return {
            success: true,
            imported: importedCount,
            message: `${importedCount} preguntas importadas exitosamente`
        }
    } catch (error) {
        console.error("JSON import error:", error)
        return { success: false, error: "Error al procesar el JSON. Verifique el formato." }
    }
}
