'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export type ProfileConfig = {
    categoryId: string
    count: number
}

export async function assignExamProfile(examId: string, userId: string, config: ProfileConfig[]) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        await prisma.examProfile.upsert({
            where: {
                exam_id_user_id: {
                    exam_id: examId,
                    user_id: userId
                }
            },
            create: {
                exam_id: examId,
                user_id: userId,
                configuration: JSON.stringify(config)
            },
            update: {
                configuration: JSON.stringify(config)
            }
        })

        revalidatePath(`/dashboard/exams/${examId}/assign`)
        return { success: true }
    } catch (error) {
        console.error("Error assigning profile", error)
        return { success: false, error: "Failed to assign profile" }
    }
}

export async function getExamProfiles(examId: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        throw new Error("Unauthorized")
    }

    const profiles = await prisma.examProfile.findMany({
        where: { exam_id: examId }
    })

    // Parse config for client
    return profiles.map(p => ({
        userId: p.user_id,
        config: JSON.parse(p.configuration) as ProfileConfig[]
    }))
}

export async function deleteExamProfile(examId: string, userId: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "Unauthorized" }
    }

    try {
        await prisma.examProfile.delete({
            where: {
                exam_id_user_id: {
                    exam_id: examId,
                    user_id: userId
                }
            }
        })
        revalidatePath(`/dashboard/exams/${examId}/assign`)
        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete profile" }
    }
}
