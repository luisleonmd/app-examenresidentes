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

function findFirstArray(obj: any): any[] | null {
    if (Array.isArray(obj)) {
        return obj;
    }
    if (obj && typeof obj === 'object') {
        for (const value of Object.values(obj)) {
            const found = findFirstArray(value);
            if (found) return found;
        }
    }
    return null;
}

function cleanAndParseJSON(jsonStr: string): any {
    let cleanStr = jsonStr.trim()
    
    // 1. Strip markdown code block wrappers if present (e.g. ```json ... ```)
    if (cleanStr.startsWith("```")) {
        cleanStr = cleanStr.replace(/^```[a-zA-Z0-9_-]*/, "")
    }
    if (cleanStr.endsWith("```")) {
        cleanStr = cleanStr.replace(/```$/, "")
    }
    cleanStr = cleanStr.trim()

    // 2. Try parsing directly first (safe, fast, doesn't mutate)
    try {
        return JSON.parse(cleanStr)
    } catch (firstError) {
        // If it failed, try to locate JSON boundaries within conversational text
        const firstBrace = cleanStr.indexOf('{')
        const firstBracket = cleanStr.indexOf('[')
        
        let startIdx = -1
        if (firstBrace !== -1 && firstBracket !== -1) {
            startIdx = Math.min(firstBrace, firstBracket)
        } else if (firstBrace !== -1) {
            startIdx = firstBrace
        } else if (firstBracket !== -1) {
            startIdx = firstBracket
        }

        const lastBrace = cleanStr.lastIndexOf('}')
        const lastBracket = cleanStr.lastIndexOf(']')
        let endIdx = -1
        if (lastBrace !== -1 && lastBracket !== -1) {
            endIdx = Math.max(lastBrace, lastBracket)
        } else if (lastBrace !== -1) {
            endIdx = lastBrace
        } else if (lastBracket !== -1) {
            endIdx = lastBracket
        }

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const extracted = cleanStr.substring(startIdx, endIdx + 1)
            try {
                return JSON.parse(extracted)
            } catch (extractError) {
                // If it fails, try cleaning trailing commas on extracted
                try {
                    const regexCleaned = extracted.replace(/,\s*([\]}])/g, "$1")
                    return JSON.parse(regexCleaned)
                } catch (e) {
                    // fall through
                }
            }
        }

        // Try cleaning trailing commas on the original cleanStr
        try {
            const regexCleaned = cleanStr.replace(/,\s*([\]}])/g, "$1")
            return JSON.parse(regexCleaned)
        } catch (secondError) {
            // Rethrow the original syntax error for accurate error position reporting
            throw firstError
        }
    }
}

export async function importQuestionsJSON(
    jsonData: string,
    options: { overrideCategoryId?: string, newCategoryName?: string } = {}
) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role === 'RESIDENTE') {
            return { success: false, error: "No autorizado" }
        }

        // Robust Parse
        let rawData = cleanAndParseJSON(jsonData)
        let questions: JSONQuestion[] = []

        // Extract nested array recursively if root is an object
        const questionsArray = findFirstArray(rawData)
        if (!questionsArray) {
            return { success: false, error: "El JSON debe contener un listado (array) de preguntas en alguna de sus propiedades o en la raíz." }
        }
        rawData = questionsArray


        // Normalize Data: Support English/Spanish synonyms and different formats
        questions = rawData.map((item: any) => {
            if (!item || typeof item !== "object") return item

            // Support English & Spanish synonyms for key fields
            const text = item.text || item.question || item.pregunta || item.enunciado || "";
            const category = item.category || item.categoria || item.tema || item.curso_rotacion || "";
            const imageUrl = item.image_url || item.imageUrl || item.imagen || undefined;
            const hint = item.hint || item.pista || "";
            
            let explanation = item.explanation || item.explicacion || item.justificacion || item.justificacion_correcta || item.rationale || "";
            
            let rawOptions = item.options || item.opciones || item.answerOptions || item.respuestas || [];
            let options: any[] = [];
            
            if (Array.isArray(rawOptions)) {
                options = rawOptions.map((opt: any) => {
                    if (!opt || typeof opt !== "object") return opt;
                    const optText = opt.text || opt.texto || opt.opcion || "";
                    const isCorrect = opt.is_correct !== undefined 
                        ? opt.is_correct 
                        : (opt.isCorrect !== undefined 
                            ? opt.isCorrect 
                            : (opt.correcta !== undefined 
                                ? opt.correcta 
                                : (opt.es_correcta !== undefined ? opt.es_correcta : false)));
                    return { text: optText, is_correct: isCorrect };
                });

                // Consolidate option-level rationales if present
                const rationales = rawOptions
                    .filter((opt: any) => opt && opt.rationale)
                    .map((opt: any, idx: number) => {
                        const letter = String.fromCharCode(65 + idx);
                        return `**Opción ${letter}:** ${opt.rationale}`;
                    });
                if (rationales.length > 0) {
                    explanation = (explanation ? explanation + "\n\n" : "") + "### Justificación de las opciones:\n" + rationales.join("\n");
                }
            } else if (typeof rawOptions === 'object' && rawOptions !== null) {
                // Support legacy format: options is an object like {"A": "...", "B": "..."}
                const correctKey = item.respuesta_correcta || item.correcta || item.es_correcta || item.isCorrect || "";
                options = Object.entries(rawOptions).map(([key, val]) => ({
                    text: String(val),
                    is_correct: correctKey === key
                }));
            }

            if (hint) {
                explanation = (explanation ? explanation + "\n\n" : "") + `**Pista/Sugerencia:** ${hint}`;
            }

            return {
                text,
                explanation,
                category,
                options,
                image_url: imageUrl
            } as JSONQuestion;
        })

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
                errors.push(`Pregunta ${i + 1}: Faltan campos requeridos (text/pregunta, category/categoria*, options/opciones).`)
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
    } catch (error: any) {
        console.error("JSON import error:", error)
        return { 
            success: false, 
            error: `Error de sintaxis en el JSON: ${error.message || String(error)}. Verifique el formato, que no falten comillas o que las llaves {} y corchetes [] estén bien balanceados.` 
        }
    }
}
