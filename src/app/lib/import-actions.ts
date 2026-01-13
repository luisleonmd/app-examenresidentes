'use server'

import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
const mammoth = require("mammoth")
// const pdf = require("pdf-parse")

const prisma = new PrismaClient()

// Standardize text: remove extra spaces, unknown chars
function cleanText(text: string) {
    return text.replace(/\s+/g, ' ').trim()
}

export async function uploadQuestionsFile(formData: FormData) {
    const session = await auth()
    if (!session?.user) return { success: false, message: "No autorizado" }

    const file = formData.get("file") as File
    const categoryId = formData.get("categoryId") as string

    if (!file || !categoryId) return { success: false, message: "Faltan datos" }

    let rawText = ""

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        if (file.name.endsWith(".docx")) {
            // Mammoth extracts raw text efficiently from DOCX
            const result = await mammoth.extractRawText({ buffer })
            rawText = result.value
        } else if (file.name.endsWith(".pdf")) {
            return { success: false, message: "PDF no soportado temporalmente. Use DOCX." }
            // const data = await pdf(buffer)
            // rawText = data.text
        } else {
            return { success: false, message: "Formato no soportado. Use PDF o DOCX." }
        }

        // --- PARSING LOGIC ---
        // Basic Regex strategy:
        // 1. Split by numbering usually found in exams: "1.", "2.", "1-", "2)" etc.
        // This is tricky, so we'll try a line-by-line state machine approach which is often more robust.

        const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
        const questions: any[] = []

        let currentQuestion: any = null
        let currentOptionId = "" // A, B, C, D

        // Regex patterns
        const questionStartRegex = /^(\d+)[\.\-\)]\s+(.*)/ // 1. Question text
        const optionStartRegex = /^([a-eA-E])[\.\)\-]\s+(.*)/ // a. Option text or A) Option text

        for (const line of lines) {
            // Check for new Question
            const qMatch = line.match(questionStartRegex)
            if (qMatch) {
                // Save previous question
                if (currentQuestion) {
                    questions.push(currentQuestion)
                }

                // Start new question
                currentQuestion = {
                    text: cleanText(qMatch[2]),
                    options: [],
                    correct_option: null // Will try to detect later
                }
                continue
            }

            // Check for Option
            const optMatch = line.match(optionStartRegex)
            if (currentQuestion && optMatch) {
                const letter = optMatch[1].toUpperCase()
                const text = cleanText(optMatch[2])

                // Detect correctness (often marked with * or (correcta))
                let isCorrect = false
                let cleanOptionText = text

                if (text.toLowerCase().includes("(correcta)") || text.includes("*")) {
                    isCorrect = true
                    cleanOptionText = text.replace(/\(correcta\)/i, "").replace(/\*/g, "").trim()
                }

                currentQuestion.options.push({
                    id: letter,
                    text: cleanOptionText,
                    is_correct: isCorrect
                })
                continue
            }

            // Append to current question text (multiline support) if no option logic started yet
            if (currentQuestion && currentQuestion.options.length === 0) {
                currentQuestion.text += " " + line
            }
            // Append to last option text (multiline support)
            else if (currentQuestion && currentQuestion.options.length > 0) {
                const lastOpt = currentQuestion.options[currentQuestion.options.length - 1]
                lastOpt.text += " " + line
            }
        }
        // Push last question
        if (currentQuestion) {
            questions.push(currentQuestion)
        }

        // --- VALIDATION & SAVING ---
        let importedCount = 0
        let errors = []

        for (const q of questions) {
            // Validate structure
            if (!q.text || q.options.length < 2) {
                errors.push(`Pregunta incompleta: "${q.text?.substring(0, 30)}..."`)
                continue
            }

            // Ensure distinct letters A, B, C, D... normalize if parser messed up
            // (Skipped for MVP simplicity, assuming good format)

            // Save to DB
            // Note: We don't have explicit explanation from simple text parse usually, leaving empty
            await prisma.question.create({
                data: {
                    text: q.text,
                    explanation: "Importada automáticamente",
                    options: JSON.stringify(q.options),
                    category_id: categoryId,
                    author_id: session.user.id,
                    status: 'PUBLISHED',
                    version: 1
                }
            })
            importedCount++
        }

        revalidatePath("/dashboard/questions")

        if (importedCount === 0) {
            return {
                success: false,
                message: "No se pudieron detectar preguntas. Verifique el formato del archivo.",
                details: "El archivo debe tener formato:\n1. Pregunta...\na) Respuesta...\nb) Respuesta..."
            }
        }

        return {
            success: true,
            message: `Importación completada. ${importedCount} preguntas creadas.`,
            details: errors.length > 0 ? `Errores ignorados:\n${errors.join('\n')}` : undefined
        }

    } catch (error) {
        console.error("Import error details:", error)
        return { success: false, message: "Error procesando el archivo", details: String(error) }
    }
}
