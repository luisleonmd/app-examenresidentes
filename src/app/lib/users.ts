'use server'

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                cedula: true,
                nombre: true,
                role: true,
                cohort: true,
                active: true,
                created_at: true
            }
        })
        return users
    } catch (error) {
        console.error("Failed to fetch users:", error)
        throw new Error("Failed to fetch users")
    }
}

export async function createUser(data: any) {
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10)

        await prisma.user.create({
            data: {
                cedula: data.cedula,
                nombre: data.nombre,
                role: data.role,
                cohort: data.role === 'RESIDENTE' ? data.cohort : null,
                password_hash: hashedPassword,
                active: true
            }
        })

        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (error) {
        console.error("Failed to create user:", error)
        return { success: false, error: "Error al crear usuario. Verifique si la cédula ya existe." }
    }
}

export async function deleteUser(userId: string) {
    const { auth } = await import("@/auth")
    const session = await auth()

    // Only coordinators can delete users
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    // Prevent deleting yourself
    if (session.user.id === userId) {
        return { success: false, error: "No puedes eliminarte a ti mismo" }
    }

    try {
        // Get user to check role
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, nombre: true }
        })

        if (!userToDelete) {
            return { success: false, error: "Usuario no encontrado" }
        }

        // Delete user (cascade will handle related records)
        await prisma.user.delete({
            where: { id: userId }
        })

        revalidatePath('/dashboard/users')
        return { success: true, message: `Usuario ${userToDelete.nombre} eliminado exitosamente` }
    } catch (error) {
        console.error("Failed to delete user:", error)
        return { success: false, error: "Error al eliminar usuario. Puede que tenga datos relacionados." }
    }
}
