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

export async function importQuestionsJSON(jsonData: string) {
    const session = await auth()
    if (!session?.user || session.user.role === 'RESIDENTE') {
        return { success: false, error: "No autorizado" }
    }

    try {
        // Parse JSON
        const questions: JSONQuestion[] = JSON.parse(jsonData)

        if (!Array.isArray(questions)) {
            return { success: false, error: "El JSON debe ser un array de preguntas" }
        }

        let importedCount = 0
        const errors: string[] = []

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i]

            // Validate question structure
            if (!q.text || !q.category || !q.options || !Array.isArray(q.options)) {
                errors.push(`Pregunta ${i + 1}: Faltan campos requeridos (text, category, options)`)
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
                // Find or create category
                let category = await prisma.questionCategory.findFirst({
                    where: { name: q.category }
                })

                if (!category) {
                    category = await prisma.questionCategory.create({
                        data: { name: q.category }
                    })
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
                        category_id: category.id,
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

        if (errors.length > 0) {
            return {
                success: true,
                imported: importedCount,
                errors: errors,
                message: `Importadas ${importedCount} preguntas. ${errors.length} errores encontrados.`
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
