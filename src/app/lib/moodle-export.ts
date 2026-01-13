'use server'

import { PrismaClient } from "@prisma/client"
import { auth } from "@/auth"

const prisma = new PrismaClient()

export async function exportToMoodleXML(categoryId?: string) {
    const session = await auth()
    if (!session?.user || session.user.role === 'RESIDENTE') {
        return { success: false, error: "No autorizado" }
    }

    try {
        const questions = await prisma.question.findMany({
            where: {
                status: 'PUBLISHED',
                ...(categoryId ? { category_id: categoryId } : {})
            },
            include: {
                category: true
            },
            orderBy: { created_at: 'desc' }
        })

        // Generate Moodle XML
        const xml = generateMoodleXML(questions)

        // Convert to base64 for download
        const base64 = Buffer.from(xml, 'utf-8').toString('base64')

        return {
            success: true,
            data: base64,
            filename: categoryId
                ? `preguntas_${questions[0]?.category.name || 'categoria'}.xml`
                : 'banco_preguntas_completo.xml'
        }
    } catch (error) {
        console.error("Export to Moodle XML error:", error)
        return { success: false, error: "Error al exportar a Moodle XML" }
    }
}

function generateMoodleXML(questions: any[]): string {
    const escapeXML = (str: string) => {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
`

    questions.forEach((question) => {
        const options = JSON.parse(question.options)
        const correctAnswers = options.filter((opt: any) => opt.is_correct)

        xml += `  <question type="multichoice">
    <name>
      <text>${escapeXML(question.id)}</text>
    </name>
    <questiontext format="markdown">
      <text><![CDATA[${question.text}]]></text>
    </questiontext>
    <generalfeedback format="markdown">
      <text><![CDATA[${question.explanation || ''}]]></text>
    </generalfeedback>
    <defaultgrade>1.0000000</defaultgrade>
    <penalty>0.3333333</penalty>
    <hidden>0</hidden>
    <single>${correctAnswers.length === 1 ? 'true' : 'false'}</single>
    <shuffleanswers>true</shuffleanswers>
    <answernumbering>abc</answernumbering>
`

        // Add category tag
        if (question.category) {
            xml += `    <tags>
      <tag>
        <text>${escapeXML(question.category.name)}</text>
      </tag>
    </tags>
`
        }

        // Add image if exists
        if (question.image_url) {
            xml += `    <!-- Image URL: ${escapeXML(question.image_url)} -->
`
        }

        // Add answers
        options.forEach((option: any) => {
            const fraction = option.is_correct ? '100.0000000' : '0.0000000'
            xml += `    <answer fraction="${fraction}" format="html">
      <text><![CDATA[${option.text}]]></text>
      <feedback format="html">
        <text></text>
      </feedback>
    </answer>
`
        })

        xml += `  </question>
`
    })

    xml += `</quiz>`

    return xml
}

export async function exportToGIFT(categoryId?: string) {
    const session = await auth()
    if (!session?.user || session.user.role === 'RESIDENTE') {
        return { success: false, error: "No autorizado" }
    }

    try {
        const questions = await prisma.question.findMany({
            where: {
                status: 'PUBLISHED',
                ...(categoryId ? { category_id: categoryId } : {})
            },
            include: {
                category: true
            },
            orderBy: { created_at: 'desc' }
        })

        // Generate GIFT format (alternative format for Moodle)
        const gift = generateGIFT(questions)

        const base64 = Buffer.from(gift, 'utf-8').toString('base64')

        return {
            success: true,
            data: base64,
            filename: categoryId
                ? `preguntas_${questions[0]?.category.name || 'categoria'}.txt`
                : 'banco_preguntas_completo.txt'
        }
    } catch (error) {
        console.error("Export to GIFT error:", error)
        return { success: false, error: "Error al exportar a formato GIFT" }
    }
}

function generateGIFT(questions: any[]): string {
    let gift = '// Banco de Preguntas - Formato GIFT para Moodle\n\n'

    questions.forEach((question, index) => {
        const options = JSON.parse(question.options)

        // Category
        if (question.category) {
            gift += `$CATEGORY: $course$/${question.category.name}\n\n`
        }

        // Question title
        gift += `::Pregunta ${index + 1}::`

        // Question text (clean markdown for GIFT)
        const cleanText = question.text
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/\n/g, ' ')
            .trim()

        gift += `${cleanText} {\n`

        // Answers
        options.forEach((option: any) => {
            const prefix = option.is_correct ? '=' : '~'
            const cleanOption = option.text
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .trim()
            gift += `  ${prefix}${cleanOption}\n`
        })

        gift += '}\n\n'

        // Feedback
        if (question.explanation) {
            gift += `// Explicación: ${question.explanation}\n\n`
        }
    })

    return gift
}
