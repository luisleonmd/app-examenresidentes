'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"

const prisma = new PrismaClient()

export async function getDashboardStats() {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const role = session.user.role

        if (role === 'COORDINADOR') {
            // Full system statistics
            const [totalExams, totalQuestions, totalUsers, totalAttempts] = await Promise.all([
                prisma.exam.count(),
                prisma.question.count({ where: { status: 'PUBLISHED' } }),
                prisma.user.count({ where: { role: 'RESIDENTE' } }),
                prisma.examAttempt.count({ where: { status: 'COMPLETED' } })
            ])

            // Calculate average score
            const attempts = await prisma.examAttempt.findMany({
                where: { status: 'COMPLETED' },
                select: { score: true }
            })
            const avgScore = attempts.length > 0
                ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
                : 0

            return {
                success: true,
                stats: {
                    totalExams,
                    totalQuestions,
                    totalStudents: totalUsers,
                    totalAttempts,
                    avgScore: Math.round(avgScore * 10) / 10
                }
            }
        } else if (role === 'PROFESOR') {
            // Course-specific statistics
            const totalExams = await prisma.exam.count({
                where: { created_by: session.user.id }
            })

            const attempts = await prisma.examAttempt.findMany({
                where: {
                    exam: { created_by: session.user.id },
                    status: 'COMPLETED'
                },
                select: { score: true }
            })

            const avgScore = attempts.length > 0
                ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
                : 0

            return {
                success: true,
                stats: {
                    totalExams,
                    totalAttempts: attempts.length,
                    avgScore: Math.round(avgScore * 10) / 10
                }
            }
        } else {
            // Resident statistics
            const attempts = await prisma.examAttempt.findMany({
                where: {
                    user_id: session.user.id,
                    status: 'SUBMITTED'
                },
                select: { score: true }
            })

            const avgScore = attempts.length > 0
                ? attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length
                : 0

            const upcomingExams = await prisma.exam.count({
                where: {
                    start_window: { lte: new Date() },
                    end_window: { gte: new Date() }
                }
            })

            return {
                success: true,
                stats: {
                    totalAttempts: attempts.length,
                    avgScore: Math.round(avgScore * 10) / 10,
                    upcomingExams
                }
            }
        }
    } catch (error) {
        console.error("Dashboard stats error:", error)
        return { success: false, error: "Failed to fetch statistics" }
    }
}

export async function getPerformanceData() {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const role = session.user.role
        let attempts: any[] = []

        if (role === 'COORDINADOR') {
            attempts = await prisma.examAttempt.findMany({
                where: { status: 'SUBMITTED' },
                select: {
                    score: true,
                    end_time: true
                },
                orderBy: { end_time: 'asc' },
                take: 50
            })
        } else if (role === 'PROFESOR') {
            attempts = await prisma.examAttempt.findMany({
                where: {
                    exam: { created_by: session.user.id },
                    status: 'SUBMITTED'
                },
                select: {
                    score: true,
                    end_time: true
                },
                orderBy: { end_time: 'asc' },
                take: 50
            })
        } else {
            attempts = await prisma.examAttempt.findMany({
                where: {
                    user_id: session.user.id,
                    status: 'SUBMITTED'
                },
                select: {
                    score: true,
                    end_time: true
                },
                orderBy: { end_time: 'asc' }
            })
        }

        const chartData = attempts.map(a => ({
            date: a.end_time?.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) || '',
            score: Math.round((a.score || 0) * 10) / 10
        }))

        return { success: true, data: chartData }
    } catch (error) {
        console.error("Performance data error:", error)
        return { success: false, error: "Failed to fetch performance data" }
    }
}

export async function getRecentActivity() {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    try {
        const activities: any[] = []
        const isResident = session.user.role === 'RESIDENTE'

        // Recent exam attempts
        const recentAttempts = await prisma.examAttempt.findMany({
            where: {
                status: 'SUBMITTED',
                ...(isResident ? { user_id: session.user.id } : {})
            },
            include: {
                user: { select: { nombre: true } },
                exam: { select: { title: true } }
            },
            orderBy: { end_time: 'desc' },
            take: 5
        })

        activities.push(...recentAttempts.map(a => ({
            type: 'exam_completed',
            description: isResident
                ? `Completaste "${a.exam.title}"`
                : `${a.user.nombre} completó "${a.exam.title}"`,
            timestamp: a.end_time,
            score: a.score
        })))

        // Recent claims
        const recentClaims = await prisma.claim.findMany({
            where: isResident ? { attempt: { user_id: session.user.id } } : {},
            include: {
                attempt: {
                    include: {
                        user: { select: { nombre: true } },
                        exam: { select: { title: true } }
                    }
                },
                question: { select: { text: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 3
        })

        activities.push(...recentClaims.map(c => ({
            type: 'claim_submitted',
            description: isResident
                ? `Enviaste un reclamo en "${c.attempt.exam.title}"`
                : `${c.attempt.user.nombre} envió un reclamo`,
            timestamp: c.created_at,
            status: c.status
        })))

        // Sort by timestamp
        activities.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )

        return { success: true, activities: activities.slice(0, 10) }
    } catch (error) {
        console.error("Recent activity error:", error)
        return { success: false, error: "Failed to fetch recent activity" }
    }
}
