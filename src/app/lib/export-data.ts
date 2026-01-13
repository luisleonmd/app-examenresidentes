'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function exportExamResults(examId: string, format: 'xlsx' | 'csv' = 'xlsx') {
    const session = await auth()
    if (!session?.user || session.user.role === 'RESIDENTE') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // Fetch exam with attempts
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                attempts: {
                    where: { status: 'COMPLETED' },
                    include: {
                        user: {
                            select: { nombre: true, cedula: true }
                        }
                    },
                    orderBy: { finished_at: 'desc' }
                }
            }
        })

        if (!exam) {
            return { success: false, error: "Exam not found" }
        }

        // Prepare data
        const data = exam.attempts.map(attempt => ({
            'Estudiante': attempt.user.nombre,
            'Cédula': attempt.user.cedula,
            'Fecha': attempt.finished_at?.toLocaleDateString('es-ES') || '',
            'Hora': attempt.finished_at?.toLocaleTimeString('es-ES') || '',
            'Calificación': `${attempt.score}%`,
            'Estado': attempt.status === 'COMPLETED' ? 'Completado' : 'En progreso'
        }))

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Resultados")

        // Generate file
        const fileBuffer = format === 'xlsx'
            ? XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
            : XLSX.write(wb, { type: 'buffer', bookType: 'csv' })

        const base64 = Buffer.from(fileBuffer).toString('base64')
        const filename = `resultados_${exam.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`

        return {
            success: true,
            file: base64,
            filename,
            mimeType: format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv'
        }
    } catch (error) {
        console.error("Export error:", error)
        return { success: false, error: "Failed to export data" }
    }
}

export async function exportStudentGrades(format: 'xlsx' | 'csv' = 'xlsx') {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // Fetch all students with their attempts
        const students = await prisma.user.findMany({
            where: { role: 'RESIDENTE' },
            include: {
                exam_attempts: {
                    where: { status: 'COMPLETED' },
                    select: { score: true }
                }
            },
            orderBy: { nombre: 'asc' }
        })

        // Calculate statistics
        const data = students.map(student => {
            const scores = student.exam_attempts.map(a => a.score || 0)
            const avg = scores.length > 0
                ? scores.reduce((sum, s) => sum + s, 0) / scores.length
                : 0
            const max = scores.length > 0 ? Math.max(...scores) : 0
            const min = scores.length > 0 ? Math.min(...scores) : 0

            return {
                'Estudiante': student.nombre,
                'Cédula': student.cedula,
                'Exámenes Realizados': scores.length,
                'Promedio': `${Math.round(avg * 10) / 10}%`,
                'Mejor Nota': `${max}%`,
                'Peor Nota': scores.length > 0 ? `${min}%` : 'N/A'
            }
        })

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Calificaciones")

        // Generate file
        const fileBuffer = format === 'xlsx'
            ? XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
            : XLSX.write(wb, { type: 'buffer', bookType: 'csv' })

        const base64 = Buffer.from(fileBuffer).toString('base64')
        const filename = `calificaciones_estudiantes_${new Date().toISOString().split('T')[0]}.${format}`

        return {
            success: true,
            file: base64,
            filename,
            mimeType: format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv'
        }
    } catch (error) {
        console.error("Export error:", error)
        return { success: false, error: "Failed to export data" }
    }
}

export async function exportQuestionBank(categoryId?: string, format: 'xlsx' | 'csv' = 'xlsx') {
    const session = await auth()
    if (!session?.user || session.user.role === 'RESIDENTE') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // Fetch questions
        const questions = await prisma.question.findMany({
            where: {
                status: 'PUBLISHED',
                ...(categoryId ? { category_id: categoryId } : {})
            },
            include: {
                category: { select: { name: true } }
            },
            orderBy: { created_at: 'desc' }
        })

        // Prepare data
        const data = questions.map(q => {
            let options: any[] = []
            try {
                options = JSON.parse(q.options)
            } catch (e) {
                options = []
            }

            const row: any = {
                'ID': q.id.substring(0, 8),
                'Categoría': q.category.name,
                'Pregunta': q.text.substring(0, 200) // Limit length
            }

            // Add options
            options.forEach((opt, idx) => {
                row[`Opción ${opt.id}`] = opt.text
            })

            // Mark correct answer
            const correctOption = options.find(o => o.is_correct)
            row['Respuesta Correcta'] = correctOption?.id || ''

            if (q.explanation) {
                row['Explicación'] = q.explanation.substring(0, 200)
            }

            return row
        })

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Preguntas")

        // Generate file
        const fileBuffer = format === 'xlsx'
            ? XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
            : XLSX.write(wb, { type: 'buffer', bookType: 'csv' })

        const base64 = Buffer.from(fileBuffer).toString('base64')
        const filename = `banco_preguntas_${new Date().toISOString().split('T')[0]}.${format}`

        return {
            success: true,
            file: base64,
            filename,
            mimeType: format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv'
        }
    } catch (error) {
        console.error("Export error:", error)
        return { success: false, error: "Failed to export data" }
    }
}
