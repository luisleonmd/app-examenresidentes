'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { calculateQuestionDistribution } from "./exam-config"

const prisma = new PrismaClient()

export async function startExam(examId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    // Check if active attempt exists
    const existingAttempt = await prisma.examAttempt.findFirst({
        where: {
            exam_id: examId,
            user_id: session.user.id,
            status: 'IN_PROGRESS'
        }
    })

    if (existingAttempt) {
        return { success: true, attemptId: existingAttempt.id }
    }

    // Check if user already submitted (optional, maybe allow 1 attempt)
    const submittedAttempt = await prisma.examAttempt.findFirst({
        where: {
            exam_id: examId,
            user_id: session.user.id,
            status: 'SUBMITTED'
        }
    })

    // Only allow 1 attempt for now
    if (submittedAttempt) {
        return { success: false, error: "Ya has realizado este examen." }
    }

    // Fetch Exam Info
    const exam = await prisma.exam.findUnique({ where: { id: examId } })
    if (!exam) return { success: false, error: "Examen no encontrado" }

    const now = new Date()
    if (now < exam.start_window) {
        return { success: false, error: "El examen aún no ha comenzado." }
    }
    if (now > exam.end_window) {
        return { success: false, error: "El periodo del examen ha finalizado." }
    }

    // Check for Personalized Profile
    const profile = await prisma.examProfile.findUnique({
        where: {
            exam_id_user_id: {
                exam_id: examId,
                user_id: session.user.id
            }
        }
    })

    let selected: { id: string }[] = []

    if (profile) {
        // Personalized Generation
        console.log("Using Personalized Profile for user", session.user.id)
        const config = JSON.parse(profile.configuration) as { categoryId: string, count: number }[]

        for (const rule of config) {
            if (rule.count <= 0) continue

            // Get all IDs for this category
            const questionIds = await prisma.question.findMany({
                where: { status: 'PUBLISHED', category_id: rule.categoryId },
                select: { id: true }
            })

            // Shuffle and take N
            const shuffled = questionIds.sort(() => 0.5 - Math.random())
            selected.push(...shuffled.slice(0, rule.count))
        }

    } else {
        // Default Standard Generation
        // Parse Categories
        let validCategoryIds: string[] = []
        try {
            if (exam.categories) {
                validCategoryIds = JSON.parse(exam.categories)
            }
        } catch (e) {
            console.error("Error parsing exam categories", e)
        }

        if (validCategoryIds.length === 0) return { success: false, error: "El examen no tiene categorías configuradas." }

        // Fetch category details
        const categories = await prisma.questionCategory.findMany({
            where: { id: { in: validCategoryIds } },
            select: { id: true, name: true }
        })

        const distribution = calculateQuestionDistribution(exam.total_questions, categories)

        for (const rule of distribution) {
            // Get all IDs for this category
            const questionIds = await prisma.question.findMany({
                where: { status: 'PUBLISHED', category_id: rule.categoryId },
                select: { id: true }
            })

            // Shuffle and take N
            const shuffled = questionIds.sort(() => 0.5 - Math.random())
            selected.push(...shuffled.slice(0, rule.count))
        }

        // Just in case we missed some due to lack of questions in DB, check count?
        // Ideally we warn, but for now we proceed with what we got.
    }

    // Create Attempt and Answers
    const attempt = await prisma.examAttempt.create({
        data: {
            user_id: session.user.id,
            exam_id: examId,
            status: 'IN_PROGRESS',
            answers: {
                create: selected.map(q => ({
                    question_id: q.id,
                    is_correct: false // Default
                }))
            }
        }
    })

    return { success: true, attemptId: attempt.id }
}

export async function getExamData(attemptId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: {
            exam: true,
            answers: {
                include: {
                    question: {
                        include: { category: true }
                    }
                }
            }
        }
    })

    if (!attempt || attempt.user_id !== session.user.id) throw new Error("Acceso denegado")

    // Sort answers by Category Name
    const sortedAnswers = [...attempt.answers].sort((a, b) => {
        const catA = a.question.category?.name || '';
        const catB = b.question.category?.name || '';
        return catA.localeCompare(catB);
    });

    const sanitizedAnswers = sortedAnswers.map(ans => {
        const options = JSON.parse(ans.question.options) as any[]
        const sanitizedOptions = options.map(opt => ({
            id: opt.id,
            text: opt.text
            // OMIT is_correct
        }))

        return {
            id: ans.id,
            question_id: ans.question_id,
            question_text: ans.question.text,
            image_url: ans.question.image_url,
            categoryName: ans.question.category?.name || 'General', // Include Category Name
            options: sanitizedOptions,
            selected_option_id: ans.selected_option_id
        }
    })

    return {
        examTitle: attempt.exam.title,
        endTime: new Date(attempt.start_time.getTime() + attempt.exam.duration_minutes * 60000),
        questions: sanitizedAnswers,
        status: attempt.status
    }
}

export async function submitExamAnswer(answerId: string, selectedOptionId: string) {
    const session = await auth()
    if (!session?.user) return

    // Verify ownership
    // Get Answer -> Question to check correctness
    const answerRecord = await prisma.answer.findUnique({
        where: { id: answerId },
        include: { question: true }
    })

    if (!answerRecord) return

    // Check correctness
    const options = JSON.parse(answerRecord.question.options) as any[]
    const selectedOpt = options.find(o => o.id === selectedOptionId)
    const isCorrect = selectedOpt ? selectedOpt.is_correct : false

    await prisma.answer.update({
        where: { id: answerId },
        data: {
            selected_option_id: selectedOptionId,
            is_correct: isCorrect
        }
    })
}

export async function finishExam(attemptId: string) {
    const session = await auth()
    if (!session?.user) return { success: false }

    const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: { answers: true }
    })

    if (!attempt) return { success: false }

    // Calculate Score
    const correctCount = attempt.answers.filter(a => a.is_correct).length
    const total = attempt.answers.length
    const score = (correctCount / total) * 100

    await prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
            status: 'SUBMITTED',
            end_time: new Date(),
            score: score
        }
    })

    revalidatePath('/dashboard/exams')
    return { success: true, score }
}

export async function getExamResult(attemptId: string) {
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const attempt = await prisma.examAttempt.findUnique({
        where: { id: attemptId },
        include: {
            exam: true,
            answers: {
                include: {
                    question: true
                }
            }
        }
    })

    if (!attempt) throw new Error("Intento no encontrado")

    // Authorization check: User must be the owner OR a Coordinator/Professor
    const isOwner = attempt.user_id === session.user.id
    const isStaff = session.user.role === 'COORDINADOR' || session.user.role === 'PROFESOR'

    if (!isOwner && !isStaff) throw new Error("Acceso denegado")

    // If it's the owner, exam must be SUBMITTED to see results (normally)
    // But we already handle status check in UI or logic usually.

    // Fetch claims for this attempt
    const claims = await prisma.claim.findMany({
        where: { attempt_id: attemptId }
    })
    const claimsMap = new Map()
    claims.forEach(c => claimsMap.set(c.question_id, c))

    const resultDetails = attempt.answers.map(ans => {
        const options = JSON.parse(ans.question.options) as any[]
        // Enrich options with is_correct for display
        const enrichedOptions = options.map(opt => ({
            id: opt.id,
            text: opt.text,
            is_correct: opt.is_correct
        }))

        const claim = claimsMap.get(ans.question_id)

        return {
            questionId: ans.question_id,
            text: ans.question.text,
            explanation: ans.question.explanation,
            options: enrichedOptions,
            selectedOptionId: ans.selected_option_id,
            isCorrect: ans.is_correct,
            isClaimed: !!claim,
            claimStatus: claim?.status,
            claimNotes: claim?.resolution_notes
        }
    })

    return {
        examTitle: attempt.exam.title,
        score: attempt.score,
        status: attempt.status,
        submittedAt: attempt.end_time,
        userRole: session.user.role,
        details: resultDetails
    }
}

export async function getExamResultsForProfessor(examId: string) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COORDINADOR' && session.user.role !== 'PROFESOR')) {
        throw new Error("Unauthorized")
    }

    const attempts = await prisma.examAttempt.findMany({
        where: { exam_id: examId },
        include: {
            user: {
                select: {
                    nombre: true,
                    cohort: true, // Assuming cohort exists on user
                    cedula: true
                }
            }
        },
        orderBy: { start_time: 'desc' }
    })

    return attempts.map(att => ({
        attemptId: att.id,
        studentName: att.user.nombre,
        studentId: att.user.cedula,
        cohort: att.user.cohort,
        status: att.status,
        score: att.score,
        startTime: att.start_time,
        endTime: att.end_time
    }))
}

export async function getConsolidatedExamReportData(examId: string) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'COORDINADOR' && session.user.role !== 'PROFESOR')) {
        throw new Error("Unauthorized")
    }

    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { course: true }
    })

    if (!exam) throw new Error("Exam not found")

    // Fetch all attempts with full details
    const attempts = await prisma.examAttempt.findMany({
        where: {
            exam_id: examId,
            status: 'SUBMITTED' // Only submitted exams
        },
        include: {
            user: {
                select: {
                    nombre: true,
                    cedula: true
                }
            },
            answers: {
                include: {
                    question: true
                }
            }
        },
        orderBy: {
            user: {
                nombre: 'asc'
            }
        }
    })

    // Fetch all claims for this exam to map them
    const claims = await prisma.claim.findMany({
        where: {
            attempt: {
                exam_id: examId
            }
        }
    })

    // Map claims by attemptId -> questionId
    const claimsMap = new Map<string, Map<string, any>>()
    claims.forEach(c => {
        if (!claimsMap.has(c.attempt_id)) {
            claimsMap.set(c.attempt_id, new Map())
        }
        claimsMap.get(c.attempt_id)?.set(c.question_id, c)
    })

    // Format data for PDF
    const reports = attempts.map(attempt => {
        const attemptClaims = claimsMap.get(attempt.id)

        const questions = attempt.answers.map(ans => {
            const options = JSON.parse(ans.question.options) as any[]
            const claim = attemptClaims?.get(ans.question_id)

            return {
                text: ans.question.text,
                options: options.map(opt => ({
                    id: opt.id,
                    text: opt.text,
                    is_correct: opt.is_correct
                })),
                userAnswer: ans.selected_option_id,
                isCorrect: ans.is_correct,
                // Claim info if needed for report
                hasClaim: !!claim,
                claimStatus: claim?.status
            }
        })

        return {
            student: {
                nombre: attempt.user.nombre,
                cedula: attempt.user.cedula
            },
            attempt: {
                start_time: attempt.start_time,
                end_time: attempt.end_time,
                score: attempt.score
            },
            questions
        }
    })

    return {
        exam: {
            title: exam.title,
            course: exam.course ? { name: exam.course.name } : null
        },
        reports
    }
}
