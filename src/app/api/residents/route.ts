import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const residents = await prisma.user.findMany({
            where: { role: 'RESIDENTE' },
            select: {
                id: true,
                nombre: true,
                cedula: true
            },
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json(residents)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch residents' }, { status: 500 })
    }
}
