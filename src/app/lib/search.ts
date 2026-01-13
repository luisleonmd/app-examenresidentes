'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"

const prisma = new PrismaClient()

export async function globalSearch(query: string) {
    const session = await auth()
    if (!session?.user || !query || query.trim().length < 2) {
        return { success: false, results: {} }
    }

    try {
        const role = session.user.role
        const searchTerm = query.toLowerCase()

        // Search exams
        const exams = await prisma.exam.findMany({
            where: {
                title: { contains: searchTerm }
            },
            select: {
                id: true,
                title: true,
                start_window: true,
                end_window: true
            },
            take: 5
        })

        // Search questions (professors and coordinators only)
        let questions: any[] = []
        if (role !== 'RESIDENTE') {
            questions = await prisma.question.findMany({
                where: {
                    OR: [
                        { text: { contains: searchTerm } },
                        { category: { name: { contains: searchTerm } } }
                    ],
                    status: 'PUBLISHED'
                },
                select: {
                    id: true,
                    text: true,
                    category: { select: { name: true } }
                },
                take: 5
            })
        }

        // Search students (coordinators and professors only)
        let students: any[] = []
        if (role === 'COORDINADOR' || role === 'PROFESOR') {
            students = await prisma.user.findMany({
                where: {
                    role: 'RESIDENTE',
                    OR: [
                        { nombre: { contains: searchTerm } },
                        { cedula: { contains: searchTerm } }
                    ]
                },
                select: {
                    id: true,
                    nombre: true,
                    cedula: true
                },
                take: 5
            })
        }

        // Search categories
        const categories = await prisma.questionCategory.findMany({
            where: {
                name: { contains: searchTerm }
            },
            select: {
                id: true,
                name: true,
                _count: { select: { questions: true } }
            },
            take: 5
        })

        return {
            success: true,
            results: {
                exams,
                questions,
                students,
                categories: categories.map(c => ({
                    id: c.id,
                    name: c.name,
                    questionCount: c._count.questions
                }))
            }
        }
    } catch (error) {
        console.error("Search error:", error)
        return { success: false, results: {} }
    }
}
