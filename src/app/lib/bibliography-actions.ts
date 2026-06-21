"use server"

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { writeFile, unlink, mkdir } from "fs/promises"
import { join } from "path"
// @ts-ignore - pdf-parse lacks official ts declaration but is fully compatible
const pdf = require("pdf-parse")
import mammoth from "mammoth"

const prisma = new PrismaClient()

// Helper to extract text from PDF buffer
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer)
        return data.text || ""
    } catch (e: any) {
        console.error("PDF Parsing Error:", e)
        throw new Error("Error al leer el archivo PDF. Asegúrate de que no esté protegido o dañado.")
    }
}

// Helper to extract text from DOCX buffer
async function extractTextFromWord(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer })
        return result.value || ""
    } catch (e: any) {
        console.error("Word Parsing Error:", e)
        throw new Error("Error al leer el archivo Word (.docx). Asegúrate de que esté en formato docx válido.")
    }
}

// Helper to extract text from Web URL
async function extractTextFromUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            next: { revalidate: 3600 } // cache for 1 hour
        })

        if (!response.ok) {
            throw new Error(`Servidor web respondió con código ${response.status}`)
        }

        const html = await response.text()

        // Strip HTML, scripts, and styles
        const cleanText = html
            .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
            .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()

        return cleanText.substring(0, 50000) // limit to 50k chars of clean text to avoid bloating context
    } catch (e: any) {
        console.error("URL Fetching/Parsing Error:", e)
        throw new Error("Error al leer el enlace web: " + e.message)
    }
}

export async function uploadBibliographyResource(formData: FormData) {
    const session = await auth()

    // 1. Authorization
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    try {
        const categoryId = formData.get("categoryId") as string
        const title = formData.get("title") as string
        const type = formData.get("type") as "PDF" | "WORD" | "WEB" | "VIDEO" | "AUDIO"
        const url = formData.get("url") as string | null
        const notes = formData.get("notes") as string | null
        const file = formData.get("file") as File | null

        if (!categoryId || !title || !type) {
            return { success: false, error: "Faltan campos requeridos" }
        }

        let filePath: string | null = null
        let extractedText: string | null = notes || ""

        // 2. Process Files
        if (type !== "WEB" && file && file.size > 0) {
            // Check file size (50 MB limit)
            const MAX_SIZE = 50 * 1024 * 1024 // 50 Megabytes
            if (file.size > MAX_SIZE) {
                return { success: false, error: "El archivo excede el límite de 50 MB permitido." }
            }

            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Ensure directory exists
            const uploadDir = join(process.cwd(), "public/uploads/bibliography")
            await mkdir(uploadDir, { recursive: true })

            // Create unique filename
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
            const filename = `${categoryId}-${Date.now()}-${cleanFileName}`
            const fullPath = join(uploadDir, filename)

            await writeFile(fullPath, buffer)
            filePath = `/uploads/bibliography/${filename}`

            // Extract text content if applicable
            if (type === "PDF") {
                const pdfText = await extractTextFromPDF(buffer)
                extractedText = `${pdfText}\n\n${notes || ""}`.trim()
            } else if (type === "WORD") {
                const wordText = await extractTextFromWord(buffer)
                extractedText = `${wordText}\n\n${notes || ""}`.trim()
            }
        } 
        
        // 3. Process URL
        else if (type === "WEB" && url) {
            const webText = await extractTextFromUrl(url)
            extractedText = `${webText}\n\n${notes || ""}`.trim()
        }

        // 4. Save to Database
        await prisma.categoryBibliography.create({
            data: {
                category_id: categoryId,
                title: title.trim(),
                type: type,
                url: type === "WEB" ? url : null,
                file_path: filePath,
                text_content: extractedText,
            }
        })

        revalidatePath('/dashboard/casos-clinicos')
        return { success: true }

    } catch (error: any) {
        console.error("Upload Bibliography Resource Error:", error)
        return { success: false, error: error.message || "Error al subir el recurso de bibliografía" }
    }
}

export async function deleteBibliographyResource(id: string) {
    const session = await auth()

    // Authorization
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        return { success: false, error: "No autorizado" }
    }

    try {
        const resource = await prisma.categoryBibliography.findUnique({
            where: { id }
        })

        if (!resource) {
            return { success: false, error: "Recurso no encontrado" }
        }

        // Remove file if exists
        if (resource.file_path) {
            const fullPath = join(process.cwd(), "public", resource.file_path)
            try {
                await unlink(fullPath)
            } catch (e) {
                console.warn(`File at ${fullPath} not found for deletion, moving on:`, e)
            }
        }

        // Remove from DB
        await prisma.categoryBibliography.delete({
            where: { id }
        })

        revalidatePath('/dashboard/casos-clinicos')
        return { success: true }

    } catch (error: any) {
        console.error("Delete Bibliography Resource Error:", error)
        return { success: false, error: error.message || "Error al eliminar el recurso de bibliografía" }
    }
}
