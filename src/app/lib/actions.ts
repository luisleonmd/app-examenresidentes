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

import { sendEmail } from '@/app/lib/email';
import { randomBytes } from 'crypto';

export async function resetPassword(formData: FormData) {
    const cedula = formData.get('cedula') as string;
    const email = formData.get('email') as string;

    if (!cedula || !email) {
        return { error: 'Cédula y correo son requeridos.' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { cedula },
        });

        if (!user || user.email !== email) {
            // For security, do not reveal if user exists or email doesn't match, or generic message
            // But user requested "cedula and mail must coincide"
            return { error: 'Datos incorrectos o no coinciden con nuestros registros.' };
        }

        // Generate provisional password
        const provisionalPassword = randomBytes(4).toString('hex'); // 8 chars
        const hashedPassword = await bcrypt.hash(provisionalPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password_hash: hashedPassword,
                must_change_password: true // Check schema if we added this, yes we did.
            },
        });

        const html = `
            <h1>Recuperación de Contraseña</h1>
            <p>Hola ${user.nombre},</p>
            <p>Se ha solicitado un restablecimiento de contraseña para su cuenta.</p>
            <p><strong>Su nueva contraseña provisional es: ${provisionalPassword}</strong></p>
            <p>Por favor ingrese con esta contraseña.</p>
        `;

        await sendEmail(email, 'Recuperación de Contraseña - Sistema Residentes', html);

        return { success: 'Se ha enviado una nueva contraseña a su correo.' };

    } catch (error) {
        console.error('Reset password error:', error);
        return { error: 'Error al procesar la solicitud.' };
    }
}
