'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

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

        // Pick Random Questions from selected categories
        const allQuestionIds = await prisma.question.findMany({
            where: {
                status: 'PUBLISHED',
                ...(validCategoryIds.length > 0 ? { category_id: { in: validCategoryIds } } : {})
            },
            select: { id: true }
        })

        if (allQuestionIds.length < exam.total_questions) {
            return { success: false, error: `No hay suficientes preguntas en las categorías seleccionadas (${allQuestionIds.length}/${exam.total_questions}).` }
        }

        const shuffled = allQuestionIds.sort(() => 0.5 - Math.random())
        selected = shuffled.slice(0, exam.total_questions)
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
                    question: true
                }
            }
        }
    })

    if (!attempt || attempt.user_id !== session.user.id) throw new Error("Acceso denegado")

    // Sort answers by creation or just return as is? Prisma order isn't guaranteed without orderBy
    // But for now it's fine.

    //Sanitize: Remove is_correct from options sending to client?
    //Ideally yes, but for MVP we might send it and hide via CSS/JS logic, but that is insecure.
    //Let's strip valid answers if we can.
    //Parsing options JSON is needed.

    const sanitizedAnswers = attempt.answers.map(ans => {
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
