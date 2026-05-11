/**
 * types/questions.ts
 * 
 * Interfaz unificada de preguntas médicas.
 * Cubre tanto el formato JSON del "Banco de Preguntas" (Creador de Preguntas)
 * como el formato de la base de datos de la "App Examen de Residentes".
 * 
 * Ambos proyectos pueden importar estas interfaces para garantizar consistencia.
 */

export type QuestionSource = "json_bank" | "database"

export type JsonQuestionOptions = {
    [key: string]: string
}

export type JsonFeedbackIncorrecto = {
    [key: string]: string
}

export interface JsonQuestion {
    id: string
    curso_rotacion: string
    tema: string
    caso_clinico: string
    pregunta: string
    opciones: JsonQuestionOptions
    respuesta_correcta: string
    feedback_incorrecto?: JsonFeedbackIncorrecto
    justificacion_correcta: string
    bibliografia: string[]
    image_url?: string
}

export interface DbQuestionOption {
    id: string
    question_id: string
    text: string
    is_correct: boolean
}

export interface DbQuestion {
    id: string
    category_id: string
    text: string
    options: DbQuestionOption[]
    source?: QuestionSource
    source_id?: string
    explanation?: string
    image_url?: string
    created_at: Date
    updated_at: Date
}

export interface UnifiedOption {
    label: string
    text: string
    is_correct: boolean
    feedback_incorrect?: string
}

export interface UnifiedQuestion {
    id: string
    rotation: string
    topic?: string
    clinical_case: string
    question: string
    options: UnifiedOption[]
    correct_option: string
    explanation: string
    bibliography: string[]
    image_url?: string
    source: QuestionSource
    source_id?: string
}

export function fromJsonQuestion(json: JsonQuestion): UnifiedQuestion {
    const optionLabels = Object.keys(json.opciones)
    const options: UnifiedOption[] = optionLabels.map(label => ({
        label,
        text: json.opciones[label],
        is_correct: label === json.respuesta_correcta,
        feedback_incorrect: json.feedback_incorrecto?.[label],
    }))

    return {
        id: json.id,
        rotation: json.curso_rotacion,
        topic: json.tema,
        clinical_case: json.caso_clinico,
        question: json.pregunta,
        options,
        correct_option: json.respuesta_correcta,
        explanation: json.justificacion_correcta,
        bibliography: json.bibliografia,
        image_url: json.image_url,
        source: "json_bank",
        source_id: json.id,
    }
}

export const JSON_BANK_ROTATIONS: Record<string, string> = {
    "Clínica de VIH":                 "Clínica VIH",
    "Medicina Interna":               "Medicina Interna",
    "Geriatría":                      "Geriatría",
    "Ginecología y Obstetricia":      "Ginecología",
    "Pediatría":                      "Pediatría",
    "Psiquiatría":                    "Psiquiatría",
    "Dermatología":                   "Dermatología",
    "Neonatología":                   "Neonatología",
    "Hospital de Día":                "Hospital de Día",
    "Otorrinolaringología":           "Otorrinolaringología",
    "Oftalmología":                   "Oftalmología",
    "Ortopedia":                      "Ortopedia",
    "Comunidad 1":                    "Comunidad 1",
    "Comunidad 2":                    "Comunidad 2",
    "Cirugía Menor":                  "Cirugía Menor",
    "Medicina Familiar 1":            "Curso Familiar 1",
    "Medicina Familiar 2":            "Curso Familiar 2",
    "Gestión en Salud":               "Curso Gestión",
    "Salud Pública":                  "Curso Salud Pública",
    "Emergencias":                    "Curso Emergencias",
    "Valoración Perioperatoria":      "Curso Valoración Perioperatoria",
    "Ultrasonido POCUS":              "Curso Ultrasonido",
}
