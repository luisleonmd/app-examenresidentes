'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { getCategories } from "./questions"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const prisma = new PrismaClient()

// Simple regex-based helper to avoid external dependencies
// since npm install failed
function extractTagContent(xml: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`)
    const match = xml.match(regex)
    return match ? match[1].trim() : ""
}

function extractInnerTagText(xmlFragment: string, tagName: string): string {
    // Often Moodle wraps text in <text></text> inside other tags
    // e.g. <questiontext><text>My Question</text></questiontext>
    const outerContent = extractTagContent(xmlFragment, tagName)
    if (!outerContent) return ""

    // Check for inner <text>
    const innerText = extractTagContent(outerContent, "text")
    return innerText || outerContent
}

function extractAllTags(xml: string, tagName: string): string[] {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'g')
    const matches = xml.match(regex)
    return matches || []
}

// Helper to extract attributes robustly
function getAttribute(tag: string, attr: string): string | null {
    const match = tag.match(new RegExp(`${attr}="([^"]*)"`))
    return match ? match[1] : null
}
const cleanText = (text: string): string => {
    if (!text) return ""
    // Remove CDATA wrappers first to get the inner content
    let cleaned = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')

    // Decode common entities BEFORE stripping tags
    // This ensures &lt;p&gt; becomes <p> so it can be stripped
    cleaned = cleaned
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#039;/g, "'")

    // Remove text that looks like Moodle feedback or file references if they leaked
    // "Su respuesta es correcta" is often in the feedback text

    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '')

    return cleaned.trim()
}

export async function importMoodleXML(xmlContent: string) {
    const session = await auth()
    if (!session?.user) return { success: false, error: "Unauthorized" }

    // Normalize XML content to handle different line endings and spacing
    const normalizedXML = xmlContent.replace(/\r\n/g, '\n')

    // 1. Split by <question> tags more robustly
    // Use a regex that captures the full tag content, handling potential extra attributes
    const questionRegex = /<question[^>]*type="([^"]*)"[^>]*>([\s\S]*?)<\/question>/g

    // We manually execute regex to handle iteration
    let match
    const questions = []
    while ((match = questionRegex.exec(normalizedXML)) !== null) {
        questions.push({
            type: match[1],
            content: match[2], // This is the inner content
            fullMatch: match[0]
        })
    }

    if (questions.length === 0) {
        return { success: false, error: "No se encontraron preguntas compatibles en el XML." }
    }

    const existingCategories = await getCategories()

    // Helper to find or create category
    const getCategoryId = async (catName: string): Promise<string> => {
        // Clean Moodle path artifacts
        let cleanName = catName
            .replace(/^\$course\$\//, '') // Remove $course$/ start
            .replace(/^\$system\$\//, '') // Remove $system$/ start
            .replace(/^top\//, '') // Remove top/ start
            .replace(/^Default for [^\/]*\//, '') // Remove "Default for X/"
            .replace(/\/+$/, '') // Remove trailing slashes

        // Handle hierarchy: Moodle uses / to separate categories.
        // We will take the last segment as the name, but ideally we should keep context.
        // For simplicity in this flat system, we'll take the LAST meaningful segment that is not "top" or default.
        const segments = cleanName.split('/').filter(s => s && s !== 'top')
        const finalName = segments.length > 0 ? segments[segments.length - 1] : "General"

        if (!finalName || finalName.toLowerCase() === 'default') return existingCategories[0]?.id || ''

        // Try to match existing category
        const existing = await prisma.questionCategory.findFirst({
            where: { name: finalName }
        })
        if (existing) return existing.id

        // Create new category
        const newCat = await prisma.questionCategory.create({ data: { name: finalName } })
        return newCat.id
    }

    // Default category if none specified (will be updated by category questions)
    let currentCategoryId: string = existingCategories[0]?.id || ""
    if (!currentCategoryId) {
        // Ensure at least one category exists
        const def = await prisma.questionCategory.create({ data: { name: "General" } })
        currentCategoryId = def.id
    }

    let count = 0

    for (const q of questions) {
        if (q.type === 'category') {
            // Extract category path
            // Structure: <category><text>Path/To/Category</text></category>
            const catContent = extractTagContent(q.fullMatch, 'category')
            const catTextRaw = extractTagContent(catContent, 'text') || catContent
            const catText = cleanText(catTextRaw)

            if (catText) {
                currentCategoryId = await getCategoryId(catText)
            }
            continue
        }

        if (q.type === 'multichoice') {
            try {
                // Parse Question Text
                const questionTextRaw = extractInnerTagText(q.fullMatch, 'questiontext')
                const questionText = cleanText(questionTextRaw)

                // Parse Image if available
                // Look for <file encoding="base64">...</file> inside questiontext
                let imageUrl = null
                const questionTextBlock = extractInnerTagText(q.fullMatch, 'questiontext')
                const fileRegex = /<file[^>]*encoding="base64"[^>]*>([\s\S]*?)<\/file>/i
                const fileMatch = questionTextBlock.match(fileRegex)

                if (fileMatch) {
                    try {
                        const base64Data = fileMatch[1].trim()
                        if (base64Data) {
                            // Determine extension (default to jpg, maybe check name attr if available)
                            // But usually we can just try to save it. 
                            // For robustness, let's assume valid base64 image.
                            const buffer = Buffer.from(base64Data, 'base64')
                            const filename = `moodle-import-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`

                            // Ensure dir exists
                            const uploadDir = join(process.cwd(), "public/uploads/questions")
                            await mkdir(uploadDir, { recursive: true })

                            await writeFile(join(uploadDir, filename), buffer)
                            imageUrl = `/uploads/questions/${filename}`
                        }
                    } catch (e) {
                        console.error("Failed to process question image", e)
                    }
                }

                // Parse Explanation (Feedback)
                const feedbackRaw = extractInnerTagText(q.fullMatch, 'generalfeedback')
                const explanation = cleanText(feedbackRaw)

                // Parse Answers
                const answerTags = extractAllTags(q.fullMatch, 'answer')
                const options = []

                for (let i = 0; i < answerTags.length; i++) {
                    let ansTag = answerTags[i]

                    // Remove feedback blocks robustly
                    ansTag = ansTag.replace(/<feedback[^>]*>([\s\S]*?)<\/feedback>/gi, '')

                    // Also remove <file> tags as they just contain metadata usually
                    ansTag = ansTag.replace(/<file[^>]*>([\s\S]*?)<\/file>/gi, '')

                    const fraction = getAttribute(ansTag, 'fraction')

                    // NEW STRATEGY: Extract ALL <text> tags and find the one that isn't generic feedback
                    const internalTextTags = extractAllTags(ansTag, 'text')
                    let candidateText = ""

                    if (internalTextTags.length > 0) {
                        for (const tTag of internalTextTags) {
                            const raw = extractInnerTagText(tTag, 'text')
                            const cleaned = cleanText(raw)
                            if (!cleaned) continue

                            const lower = cleaned.toLowerCase()
                            // Skip generic feedback phrases - Broadened to catch all variants
                            if (lower.includes('su respuesta es') ||
                                lower.includes('respuesta correcta') ||
                                lower.includes('respuesta incorrecta')) {
                                continue
                            }

                            candidateText = cleaned
                            break
                        }
                    }

                    // Fallback if loop didn't find anything
                    if (!candidateText) {
                        const textRaw = extractInnerTagText(ansTag, 'text')
                        const cleaned = cleanText(textRaw)
                        const lower = cleaned.toLowerCase()
                        if (!lower.includes('su respuesta es')) {
                            candidateText = cleaned
                        }
                    }

                    if (candidateText) {
                        options.push({
                            id: String.fromCharCode(65 + i), // A, B, C...
                            text: candidateText,
                            is_correct: Number(fraction) > 90
                        })
                    }
                }

                if (options.length < 2) continue

                // Verify we have a valid category
                if (!currentCategoryId) {
                    // Fallback check
                    const general = await prisma.questionCategory.findFirst({ where: { name: "General" } })
                    currentCategoryId = general ? general.id : (await prisma.questionCategory.create({ data: { name: "General" } })).id
                }

                await prisma.question.create({
                    data: {
                        text: questionText || "Sin texto",
                        explanation: explanation,
                        image_url: imageUrl,
                        options: JSON.stringify(options),
                        category_id: currentCategoryId,
                        author_id: session.user.id,
                        status: 'PUBLISHED',
                        version: 1,
                    }
                })
                count++

            } catch (err) {
                console.error("Error parsing question manually", err)
            }
        }
    }

    revalidatePath('/dashboard/questions')
    return { success: true, count }
}
