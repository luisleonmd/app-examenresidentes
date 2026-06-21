"use server"

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

interface GeneratedQuestion {
    clinical_case: string
    question: string
    options: Array<{
        label: string
        text: string
        is_correct: boolean
    }>
    correct_option: string
    explanation: string
    bibliography: string[]
}

export async function generateQuestionsWithAI(
    categoryId: string,
    apiKey: string,
    count: number,
    difficulty: "ALTA" | "MEDIA",
    modelName: string = "gemini-1.5-flash"
) {
    const session = await auth()

    // 1. Authorization Check
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado. Solo coordinadores pueden generar preguntas con IA." }
    }

    if (!apiKey || apiKey.trim().length === 0) {
        return { success: false, error: "La API Key de Gemini es requerida." }
    }

    try {
        // 2. Fetch Category and Bibliography
        const category = await prisma.questionCategory.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return { success: false, error: "Categoría no encontrada." }
        }

        const categoryBiblio = category.bibliography 
            ? category.bibliography.trim()
            : "No hay bibliografía oficial configurada para esta rotación/curso. Por favor, usa bibliografía general recomendada de Medicina Familiar y Atención Primaria."

        // 3. Construct Prompt
        const prompt = `Actúa como un experto en educación médica y creador de exámenes profesionales para residentes de Medicina Familiar en América Latina y España, aplicando la rigurosidad analítica de los exámenes MIR de España.

Genera exactamente ${count} preguntas basadas en casos clínicos para la rotación o curso "${category.name}".

Requisitos de cada pregunta:
1. **Dificultad**: Complejidad ${difficulty === "ALTA" ? "ALTA (evalúa diagnóstico diferencial complejo, interpretación fina de pruebas, toma de decisiones ético-clínicas o tratamiento de elección)" : "MODERADA (diagnóstico directo, factores de riesgo, sospecha clínica inicial)"}.
2. **Caso Clínico**: Inicia con un caso clínico estructurado (antecedentes del paciente, signos, síntomas, exploración física y, si aplica, hallazgos de laboratorio o imagen). El residente debe analizar la historia para responder.
3. **Pregunta**: Una pregunta directa e inequívoca de opción múltiple basada en el caso clínico.
4. **Opciones**: Exactamente 4 opciones (etiquetadas como A, B, C, D). Solo UNA debe ser correcta. Los distractores (incorrectas) deben ser médicamente plausibles pero incorrectas bajo el escenario descrito.
5. **Justificación**: Explicación detallada de por qué la respuesta seleccionada es la correcta y por qué los demás distractores se descartan.
6. **Bibliografía**: Debe fundamentarse y citar explícitamente alguna de las siguientes referencias oficiales provistas:
${categoryBiblio}

Debes responder ÚNICAMENTE con un JSON Array válido que contenga ${count} objetos. Cada objeto debe tener exactamente la siguiente estructura de TypeScript/JSON:
interface GeneratedQuestion {
    clinical_case: string; // El texto del caso clínico detallado
    question: string; // La pregunta correspondiente
    options: Array<{
        label: "A" | "B" | "C" | "D";
        text: string;
        is_correct: boolean;
    }>;
    correct_option: "A" | "B" | "C" | "D";
    explanation: string; // Explicación / Justificación del caso y opciones
    bibliography: string[]; // Arreglo de referencias textuales de la bibliografía oficial citada
}

Genera solo el JSON limpio en tu respuesta. No incluyas explicaciones adicionales, introducciones ni bloques de código de markdown como \`\`\`json.`

        // 4. API Request to Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.2 // Lower temperature for more structured, factual medical questions
                }
            })
        })

        if (!response.ok) {
            const errBody = await response.text()
            console.error("Gemini API error response:", errBody)
            return { success: false, error: `Error de la API de Gemini: ${response.statusText} (${response.status})` }
        }

        const data = await response.json()
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!textResponse) {
            return { success: false, error: "La API de Gemini devolvió una respuesta vacía o mal estructurada." }
        }

        // 5. Parse and Validate JSON
        let questionsList: GeneratedQuestion[] = []
        try {
            questionsList = JSON.parse(textResponse.trim())
            if (!Array.isArray(questionsList)) {
                // If it parsed to an object instead of array, wrap it
                questionsList = [questionsList as any]
            }
        } catch (e: any) {
            console.error("Failed to parse Gemini response as JSON:", textResponse)
            return { success: false, error: "La respuesta de la IA no pudo ser interpretada como JSON válido: " + e.message }
        }

        // 6. Insert Into Database
        let createdCount = 0
        const errors: string[] = []

        for (let i = 0; i < questionsList.length; i++) {
            const q = questionsList[i]

            // Basic shape checks
            if (!q.clinical_case || !q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
                errors.push(`Pregunta ${i + 1}: Formato de estructura inválido (se requieren 4 opciones, caso y pregunta).`)
                continue
            }

            const correctOpt = q.options.find(o => o.is_correct)
            if (!correctOpt) {
                errors.push(`Pregunta ${i + 1}: Falta marcar una opción como correcta.`)
                continue
            }

            try {
                // Combine caso_clinico and question text for the main Question model
                const fullText = `${q.clinical_case}\n\nPregunta: ${q.question}`

                // Format options with simple number IDs matching standard sync logic (1, 2, 3, 4)
                const formattedOptions = q.options.map((opt, idx) => ({
                    id: String(idx + 1), // "1", "2", "3", "4"
                    text: `(${opt.label}) ${opt.text}`, // format like standard layout: "(A) opción"
                    is_correct: opt.is_correct
                }))

                // Add bibliography to explanation so it renders nicely in existing views
                const biblioString = q.bibliography && q.bibliography.length > 0
                    ? `\n\n**Bibliografía:** ${q.bibliography.join(", ")}`
                    : ""
                const explanationWithBiblio = `${q.explanation}${biblioString}`

                await prisma.question.create({
                    data: {
                        text: fullText,
                        explanation: explanationWithBiblio,
                        options: JSON.stringify(formattedOptions),
                        category_id: categoryId,
                        author_id: session.user.id,
                        status: 'PUBLISHED',
                        source: 'JSON_BANK', // Mark as clinical cases AI source
                        difficulty: difficulty, // Save difficulty level
                        version: 1
                    }
                })

                createdCount++
            } catch (err: any) {
                errors.push(`Pregunta ${i + 1}: Error de base de datos - ${err.message}`)
            }
        }

        revalidatePath('/dashboard/casos-clinicos')
        revalidatePath('/dashboard/questions')
        revalidatePath('/dashboard/categories')

        if (errors.length > 0) {
            return {
                success: createdCount > 0,
                created: createdCount,
                errors: errors,
                message: `Se crearon ${createdCount} preguntas con éxito. Ocurrieron ${errors.length} errores.`
            }
        }

        return {
            success: true,
            created: createdCount,
            message: `¡Se generaron y guardaron ${createdCount} preguntas exitosamente en la categoría "${category.name}"!`
        }

    } catch (e: any) {
        console.error("AI Generation Process Error:", e)
        return { success: false, error: "Ocurrió un error en el proceso de generación: " + e.message }
    }
}
