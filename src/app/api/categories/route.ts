import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'COORDINADOR') {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const categoryId = searchParams.get("categoryId")

        if (!categoryId) {
            return NextResponse.json({ error: "Falta el campo categoryId" }, { status: 400 })
        }

        // First, delete all questions in this category
        await prisma.question.deleteMany({
            where: { category_id: categoryId }
        })

        // Then delete the category
        await prisma.questionCategory.delete({
            where: { id: categoryId }
        })

        revalidatePath('/dashboard/categories')
        revalidatePath('/dashboard/questions')

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Failed to delete category:", error)
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
}
