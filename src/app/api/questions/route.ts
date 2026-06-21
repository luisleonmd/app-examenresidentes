import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { importQuestionsJSON } from "@/app/lib/json-import"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const categoryId = searchParams.get("categoryId")
        const source = searchParams.get("source")

        const whereClause: any = {
            status: 'PUBLISHED'
        }

        if (categoryId && categoryId !== 'all') {
            whereClause.category_id = categoryId
        }

        if (source) {
            whereClause.source = source
        }

        const questions = await prisma.question.findMany({
            where: whereClause,
            include: {
                category: true,
                author: {
                    select: { nombre: true }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json(questions)
    } catch (error: any) {
        console.error("Failed to fetch questions:", error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role === 'RESIDENTE') {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await req.json()
        const { jsonText, overrideCategoryId, newCategoryName } = body

        if (!jsonText) {
            return NextResponse.json({ error: "Falta el campo jsonText" }, { status: 400 })
        }

        const result = await importQuestionsJSON(jsonText, { overrideCategoryId, newCategoryName })
        return NextResponse.json(result)
    } catch (error: any) {
        console.error("Failed to import questions via API:", error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}
