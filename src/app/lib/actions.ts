'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: '/dashboard' });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }
        throw error;
    }
}


import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function changePassword(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, message: 'No autorizado.' };
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, message: 'Todos los campos son obligatorios.' };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, message: 'Las contraseñas nuevas no coinciden.' };
    }

    if (newPassword.length < 6) {
        return { success: false, message: 'La contraseña nueva debe tener al menos 6 caracteres.' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return { success: false, message: 'Usuario no encontrado.' };
        }

        const passwordsMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordsMatch) {
            return { success: false, message: 'La contraseña actual es incorrecta.' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password_hash: hashedPassword },
        });

        revalidatePath('/dashboard');
        return { success: true, message: 'Contraseña actualizada correctamente.' };
    } catch (error) {
        console.error('Failed to change password:', error);
        return { success: false, message: 'Error al cambiar la contraseña. Intente de nuevo.' };
    }
}
