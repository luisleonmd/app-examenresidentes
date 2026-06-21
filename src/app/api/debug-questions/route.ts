import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const categoryId = searchParams.get("categoryId")

        if (!categoryId) {
            // Return all categories with their details
            const categories = await prisma.questionCategory.findMany()
            const summary = []

            for (const cat of categories) {
                const grouped = await prisma.question.groupBy({
                    by: ["status", "source"],
                    where: { category_id: cat.id },
                    _count: { id: true }
                })
                summary.push({
                    id: cat.id,
                    name: cat.name,
                    stats: grouped
                })
            }

            return NextResponse.json({ allCategories: summary })
        }

        // 1. Check category exists
        const category = await prisma.questionCategory.findUnique({
            where: { id: categoryId }
        })

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 })
        }

        // 2. Count questions in DB for this category with all statuses/sources
        const allQuestionsCount = await prisma.question.count({
            where: { category_id: categoryId }
        })

        const questionsByStatusAndSource = await prisma.question.groupBy({
            by: ["status", "source"],
            where: { category_id: categoryId },
            _count: { id: true }
        })

        // 3. Try to query questions with standard filter
        let questions: any[] = []
        let queryError: string | null = null

        try {
            questions = await prisma.question.findMany({
                where: {
                    category_id: categoryId,
                    status: "PUBLISHED"
                },
                include: {
                    category: true,
                    author: {
                        select: { nombre: true }
                    }
                }
            })
        } catch (e: any) {
            queryError = e.message || String(e)
        }

        // 4. Return all information
        return NextResponse.json({
            categoryName: category.name,
            categoryId: category.id,
            totalQuestionsInDb: allQuestionsCount,
            groupedStats: questionsByStatusAndSource,
            queryError,
            questionsFetchedCount: questions.length,
            questionsSample: questions.slice(0, 3).map(q => ({
                id: q.id,
                text: q.text.substring(0, 50),
                status: q.status,
                source: q.source,
                authorId: q.author_id,
                authorName: q.author?.nombre
            }))
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}
