'use server';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as xlsx from 'xlsx';
import mammoth from 'mammoth';
const pdfWithAny = require('pdf-parse');
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Types
type ImportedUser = {
    nombre: string;
    cedula: string;
    email: string | null;
    status?: 'success' | 'error';
    message?: string;
};

// Helper: Normalize Cedula
function cleanCedula(raw: string | number): string {
    return String(raw).replace(/[^0-9]/g, '').trim();
}

/**
 * Main Action: Import Users from File
 */
export async function importUsersFromFile(formData: FormData) {
    const file = formData.get('file') as File;
    const cohort = formData.get('cohort') as string;

    if (!file) {
        return { success: false, message: 'No se subió ningún archivo.' };
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        let users: ImportedUser[] = [];

        // Determine Parsing Strategy based on extension
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            users = await parseExcel(buffer);
        } else if (file.name.endsWith('.docx')) {
            users = await parseWord(buffer);
        } else if (file.name.endsWith('.pdf')) {
            users = await parsePDF(buffer);
        } else {
            return { success: false, message: 'Formato no soportado. Use .xlsx, .docx o .pdf' };
        }

        if (users.length === 0) {
            return { success: false, message: 'No se encontraron usuarios válidos en el archivo.' };
        }

        // Process creation
        const results = {
            total: users.length,
            created: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const user of users) {
            // Validate minimum requirements
            if (!user.cedula || user.cedula.length < 5) {
                results.failed++;
                results.errors.push(`Fila ignorada (cédula inválida): ${user.nombre || 'Sin nombre'}`);
                continue;
            }

            try {
                // Check if user exists
                const existingByUser = await prisma.user.findUnique({ where: { cedula: user.cedula } });
                if (existingByUser) {
                    results.failed++;
                    results.errors.push(`Usuario ya existe: ${user.cedula} (${user.nombre})`);
                    continue;
                }

                // Create User
                // Password = ID (Hashed)
                const hashedPassword = await bcrypt.hash(user.cedula, 10);

                await prisma.user.create({
                    data: {
                        cedula: user.cedula,
                        nombre: user.nombre || 'Usuario Importado',
                        email: user.email,
                        role: 'RESIDENTE',
                        cohort: cohort || 'R1',
                        password_hash: hashedPassword,
                        active: true
                    }
                });

                results.created++;
            } catch (error) {
                console.error(`Error creating user ${user.cedula}:`, error);
                results.failed++;
                results.errors.push(`Error DB al crear ${user.cedula}`);
            }
        }

        revalidatePath('/dashboard/users');
        return { success: true, results };

    } catch (error) {
        console.error('Import Error:', error);
        return { success: false, message: 'Error al procesar el archivo.' };
    }
}

/**
 * Parsers
 */

async function parseExcel(buffer: Buffer): Promise<ImportedUser[]> {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json<any>(sheet);

    return jsonData.map(row => {
        // Try to find columns case-insensitive
        const keys = Object.keys(row);
        const nameKey = keys.find(k => k.match(/nombre/i));
        const idKey = keys.find(k => k.match(/c(e|é)dula/i));
        const emailKey = keys.find(k => k.match(/email|correo/i));

        return {
            nombre: nameKey ? String(row[nameKey]).trim() : '',
            cedula: idKey ? cleanCedula(row[idKey]) : '',
            email: emailKey ? String(row[emailKey]).trim() : null,
        };
    }).filter(u => u.cedula); // Filter out empty rows
}

async function parseWord(buffer: Buffer): Promise<ImportedUser[]> {
    const result = await mammoth.extractRawText({ buffer });
    return parseTextContent(result.value);
}

async function parsePDF(buffer: Buffer): Promise<ImportedUser[]> {
    // pdf-parse library
    // Need to cast to any because pdf-parse types might be tricky in strict mode or different version
    const data = await pdfWithAny(buffer);
    return parseTextContent(data.text);
}

// Heuristic: Try to find lines that look like user records
// Pattern: Name ... ID ... Email (or variations)
// This is best effort.
function parseTextContent(text: string): ImportedUser[] {
    const lines = text.split('\n');
    const users: ImportedUser[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Look for Cedula (sequence of 9+ digits)
        const cedulaMatch = trimmed.match(/\b\d{9,}\b/);
        // Look for Email
        const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

        if (cedulaMatch && emailMatch) {
            // High confidence line
            const cedula = cedulaMatch[0];
            const email = emailMatch[0];
            // Name is everything else? This is tricky. 
            // Let's assume Name comes first.
            const namePart = trimmed.replace(cedula, '').replace(email, '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ' ').trim();

            users.push({
                nombre: namePart,
                cedula: cedula,
                email: email
            });
        }
    }
    return users;
}
