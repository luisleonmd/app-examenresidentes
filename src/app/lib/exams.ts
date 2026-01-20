'use server'

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { calculateQuestionDistribution } from "./exam-config"

const prisma = new PrismaClient()

export async function getCourses() {
    try {
        return await prisma.course.findMany({ where: { active: true } })
    } catch (error) {
        throw new Error("Failed to fetch courses")
    }
}

export async function getExams() {
    const session = await auth()
    try {
        // If Resident, filter by course enrollment
        const whereClause: any = {}

        if (session?.user?.role === 'RESIDENTE') {
            // 1. Get user enrollments
            const enrollments = await prisma.enrollment.findMany({
                where: { user_id: session.user.id },
                select: { course_id: true }
            })
            const courseIds = enrollments.map(e => e.course_id)

            // 2. Filter exams: Either no course (General) or enrolled course
            // AND either general exam (no specific profiles) or assigned to this user
            whereClause.AND = [
                {
                    OR: [
                        { course_id: null },
                        { course_id: { in: courseIds } }
                    ]
                },
                {
                    OR: [
                        { profiles: { none: {} } }, // General exam (no specific assignments)
                        { profiles: { some: { user_id: session.user.id } } } // Assigned specific to me
                    ]
                }
            ]
        }

        const exams = await prisma.exam.findMany({
            where: whereClause,
            include: {
                course: true,
                creator: { select: { nombre: true } },
                profiles: {
                    include: {
                        user: { select: { nombre: true } }
                    }
                }
            },
            orderBy: { start_window: 'desc' }
        })

        // If user is logged in, fetch their attempts
        let attemptsMap = new Map()
        if (session?.user?.id) {
            const attempts = await prisma.examAttempt.findMany({
                where: {
                    user_id: session.user.id,
                    exam_id: { in: exams.map(e => e.id) }
                }
            })
            attempts.forEach(a => attemptsMap.set(a.exam_id, a))
        }

        return exams.map(exam => {
            const attempt = attemptsMap.get(exam.id)
            return {
                ...exam,
                userAttempt: attempt ? {
                    id: attempt.id,
                    status: attempt.status,
                    score: attempt.score
                } : null
            }
        })

    } catch (error) {
        console.error("Failed to fetch exams", error)
        throw new Error("Failed to fetch exams")
    }
}

export async function createExam(data: any) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const exam = await prisma.exam.create({
            data: {
                title: data.title,
                // If course_id is "general" or empty, store null or handle logic. 
                // For now, if provided use it, else null.
                course_id: data.course_id === 'general' ? null : data.course_id,
                created_by: session.user.id,
                duration_minutes: parseInt(data.duration_minutes),
                start_window: data.start_window,
                end_window: data.end_window,
                claims_start: data.claims_start,
                claims_end: data.claims_end,
                total_questions: parseInt(data.total_questions),
                // Store categories as JSON
                categories: JSON.stringify(data.categories),
                rules: JSON.stringify({})
            }
        })

        // If a specific resident was selected, create an ExamProfile for them
        if (data.assigned_to_user_id && data.assigned_to_user_id !== 'all') {
            // Fetch category names to use utility
            const selectedCategories = await prisma.questionCategory.findMany({
                where: { id: { in: data.categories } },
                select: { id: true, name: true }
            })

            const distribution = calculateQuestionDistribution(parseInt(data.total_questions), selectedCategories)

            await prisma.examProfile.create({
                data: {
                    exam_id: exam.id,
                    user_id: data.assigned_to_user_id,
                    configuration: JSON.stringify(distribution)
                }
            })
        }

        revalidatePath('/dashboard/exams')
        return { success: true }
    } catch (error) {
        console.error("Failed to create exam", error)
        return { success: false, error: "Failed to create exam" }
    }
}
export async function deleteExam(examId: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        // Delete dependencies first using a transaction or manually
        // We need to delete Claims, Answers, ExamAttempts first
        await prisma.$transaction(async (tx) => {
            // Find all attempts
            const attempts = await tx.examAttempt.findMany({
                where: { exam_id: examId },
                select: { id: true }
            })
            const attemptIds = attempts.map(a => a.id)

            if (attemptIds.length > 0) {
                // Delete Claims linked to these attempts
                await tx.claim.deleteMany({
                    where: { attempt_id: { in: attemptIds } }
                })

                // Delete Answers linked to these attempts
                await tx.answer.deleteMany({
                    where: { attempt_id: { in: attemptIds } }
                })

                // Delete Attempts
                await tx.examAttempt.deleteMany({
                    where: { exam_id: examId }
                })
            }

            // Delete Exam Profiles (Assigned Users)
            await tx.examProfile.deleteMany({
                where: { exam_id: examId }
            })

            // Finally delete the exam
            await tx.exam.delete({
                where: { id: examId }
            })
        })

        revalidatePath('/dashboard/exams')
        return { success: true }
    } catch (error) {
        console.error("Delete exam error:", error)
        return { success: false, error: "Error al eliminar el examen." }
    }
}
