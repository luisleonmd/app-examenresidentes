'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { renderToBuffer } from '@react-pdf/renderer'
import { ExamReportTemplate } from '@/components/pdf/exam-report-template'
import { CourseReportTemplate } from '@/components/pdf/course-report-template'

const prisma = new PrismaClient()

export async function generateExamReport(attemptId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "No autorizado" }

    try {
        // Fetch attempt with all related data
        const attempt = await prisma.examAttempt.findUnique({
            where: { id: attemptId },
            include: {
                user: { select: { nombre: true, cedula: true } },
                exam: {
                    include: {
                        course: { select: { name: true } }
                    }
                },
                answers: {
                    include: {
                        question: true
                    }
                }
            }
        })

        if (!attempt) {
            return { success: false, error: "Intento no encontrado" }
        }

        // Authorization check
        if (attempt.user_id !== session.user.id && session.user.role === 'RESIDENTE') {
            return { success: false, error: "No autorizado" }
        }

        // Parse questions and answers
        const questions = attempt.answers.map(answer => {
            const options = JSON.parse(answer.question.options)
            const correctOption = options.find((opt: any) => opt.is_correct)

            return {
                text: answer.question.text,
                options: options,
                userAnswer: answer.selected_option_id,
                isCorrect: answer.is_correct
            }
        })

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            ExamReportTemplate({
                student: attempt.user,
                exam: attempt.exam,
                attempt: {
                    start_time: attempt.start_time,
                    end_time: attempt.end_time,
                    score: attempt.score
                },
                questions
            })
        )

        // Convert buffer to base64 for client download
        const base64 = pdfBuffer.toString('base64')

        return {
            success: true,
            pdf: base64,
            filename: `examen_${attempt.exam.title.replace(/\s+/g, '_')}_${attempt.user.nombre.replace(/\s+/g, '_')}.pdf`
        }
    } catch (error) {
        console.error("Error generating exam report:", error)
        return { success: false, error: "Error al generar el reporte" }
    }
}

export async function generateCourseReport(examId: string) {
    const session = await auth()
    if (!session?.user || session.user.role === 'RESIDENTE') {
        return { success: false, error: "No autorizado" }
    }

    try {
        // Fetch exam with attempts
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                course: { select: { name: true } },
                attempts: {
                    where: { status: 'COMPLETED' },
                    include: {
                        user: { select: { nombre: true, cedula: true } }
                    }
                }
            }
        })

        if (!exam) {
            return { success: false, error: "Examen no encontrado" }
        }

        // Calculate statistics
        const scores = exam.attempts.map(a => a.score || 0)
        const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
        const passed = scores.filter(s => s >= 70).length
        const failed = scores.filter(s => s < 70).length
        const pending = 0 // Could calculate from enrolled students

        // Prepare student data
        const students = exam.attempts.map(attempt => ({
            nombre: attempt.user.nombre,
            cedula: attempt.user.cedula,
            score: attempt.score,
            status: (attempt.score || 0) >= 70 ? 'Aprobado' : 'Reprobado',
            completedAt: attempt.end_time
        }))

        // Generate PDF
        const pdfBuffer = await renderToBuffer(
            CourseReportTemplate({
                course: exam.course || { name: 'General' },
                exam: { title: exam.title },
                students,
                statistics: { average, passed, failed, pending }
            })
        )

        const base64 = pdfBuffer.toString('base64')

        return {
            success: true,
            pdf: base64,
            filename: `reporte_curso_${exam.title.replace(/\s+/g, '_')}.pdf`
        }
    } catch (error) {
        console.error("Error generating course report:", error)
        return { success: false, error: "Error al generar el reporte" }
    }
}
