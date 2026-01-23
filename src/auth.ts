import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function getUser(cedula: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { cedula },
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    session: { strategy: 'jwt', maxAge: 600 }, // 10 minutes
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.permissions = user.permissions;
                token.cedula = user.cedula;
                token.nombre = user.nombre;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.permissions = token.permissions as string | null;
                session.user.cedula = token.cedula as string;
                session.user.nombre = token.nombre as string;
            }
            return session;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                console.log('Authorizing credentials:', credentials);
                const parsedCredentials = z
                    .object({ cedula: z.string(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { cedula, password } = parsedCredentials.data;
                    const user = await getUser(cedula);
                    console.log('User found:', user ? user.cedula : 'null');
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password_hash);
                    console.log('Password match:', passwordsMatch);
                    if (passwordsMatch) return user;
                } else {
                    console.log('Invalid zod parse:', parsedCredentials.error);
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
