'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) {
    try {
        await prisma.notification.create({
            data: {
                user_id: userId,
                type,
                title,
                message,
                link
            }
        })
        return { success: true }
    } catch (error) {
        console.error("Create notification error:", error)
        return { success: false }
    }
}

export async function getNotifications() {
    const session = await auth()
    if (!session?.user) return { success: false, notifications: [] }

    try {
        const notifications = await prisma.notification.findMany({
            where: { user_id: session.user.id },
            orderBy: { created_at: 'desc' },
            take: 20
        })

        const unreadCount = await prisma.notification.count({
            where: {
                user_id: session.user.id,
                read: false
            }
        })

        return {
            success: true,
            notifications,
            unreadCount
        }
    } catch (error) {
        console.error("Get notifications error:", error)
        return { success: false, notifications: [], unreadCount: 0 }
    }
}

export async function markAsRead(notificationId: string) {
    const session = await auth()
    if (!session?.user) return { success: false }

    try {
        await prisma.notification.update({
            where: {
                id: notificationId,
                user_id: session.user.id // Ensure user owns notification
            },
            data: { read: true }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Mark as read error:", error)
        return { success: false }
    }
}

export async function markAllAsRead() {
    const session = await auth()
    if (!session?.user) return { success: false }

    try {
        await prisma.notification.updateMany({
            where: {
                user_id: session.user.id,
                read: false
            },
            data: { read: true }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Mark all as read error:", error)
        return { success: false }
    }
}
