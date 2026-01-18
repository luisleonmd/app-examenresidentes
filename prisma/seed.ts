import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const categories = [
        "Medicina Interna", "Comunidad 1", "Comunidad 2", "Geriatría", "Ginecología",
        "Pediatría", "Ortopedia", "Oftalmología", "Otorrinolaringología", "Fisiatría",
        "Psiquiatría", "Hospital de Día", "Clínica VIH", "Cirugía Menor",
        "Curso Familiar 1", "Curso Familiar 2", "Curso Gestión", "Curso Salud Pública",
        "Curso Emergencias", "Curso Valoración Perioperatoria", "Curso Ultrasonido"
    ]

    console.log('Seeding categories...')
    for (const name of categories) {
        // Check if exists to avoid duplicates if re-run (though uuid makes it tricky, normally upsert by name if unique, but name is not unique in schema, just id)
        // For simplicity, we just create. In prod we might check.
        // Actually, let's just create if count is 0.
        const count = await prisma.questionCategory.count({ where: { name } })
        if (count === 0) {
            await prisma.questionCategory.create({ data: { name } })
        }
    }

    // Seed Courses based on categories or new list
    const courses = [
        { name: "Medicina Interna", code: "MED-001" },
        { name: "Pediatría", code: "PED-001" },
        { name: "Ginecología", code: "GIN-001" },
        { name: "Cirugía", code: "CIR-001" },
        { name: "Psiquiatría", code: "PSI-001" },
        { name: "Medicina Familiar 1", code: "FAM-001" },
        { name: "Medicina Familiar 2", code: "FAM-002" },
    ]

    console.log('Seeding courses...')
    for (const c of courses) {
        const count = await prisma.course.count({ where: { code: c.code } })
        if (count === 0) {
            await prisma.course.create({ data: c })
        }
    }
    const hashedPassword = await bcrypt.hash('password123', 10)


    // Upsert Admin
    const admin = await prisma.user.upsert({
        where: { cedula: '111111111' },
        update: {
            email: 'luisleonmd@gmail.com'
        },
        create: {
            cedula: '111111111',
            nombre: 'Admin Coordinador',
            email: 'luisleonmd@gmail.com',
            role: 'COORDINADOR',
            password_hash: hashedPassword,
            active: true
        }
    })


    // Upsert Resident
    const resident = await prisma.user.upsert({
        where: { cedula: '222222222' },
        update: {},
        create: {
            cedula: '222222222',
            nombre: 'Juan Residente',
            role: 'RESIDENTE',
            password_hash: hashedPassword,
            cohort: 'R1',
            active: true
        }
    })

    // Get a category for questions
    const catInternal = await prisma.questionCategory.findFirst({ where: { name: "Medicina Interna" } })

    if (catInternal) {
        // Create Questions
        console.log('Seeding questions...')
        const questionsData = [
            {
                text: "¿Cuál es el tratamiento de primera línea para la hipertensión arterial estadio 1 sin comorbilidades?",
                options: JSON.stringify([
                    { id: "opt1", text: "IECA o ARA II", is_correct: true },
                    { id: "opt2", text: "Betabloqueadores", is_correct: false },
                    { id: "opt3", text: "Diuréticos de asa", is_correct: false },
                    { id: "opt4", text: "Calcioantagonistas", is_correct: false }
                ])
            },
            {
                text: "¿Cuál es la causa más frecuente de insuficiencia cardíaca derecha?",
                options: JSON.stringify([
                    { id: "opt1", text: "Infarto de miocardio", is_correct: false },
                    { id: "opt2", text: "Insuficiencia cardíaca izquierda", is_correct: true },
                    { id: "opt3", text: "Hipertensión pulmonar primaria", is_correct: false },
                    { id: "opt4", text: "Estenosis pulmonar", is_correct: false }
                ])
            },
            {
                text: "¿Criterio diagnóstico para Diabetes Mellitus tipo 2 según la ADA?",
                options: JSON.stringify([
                    { id: "opt1", text: "HbA1c >= 6.5%", is_correct: true },
                    { id: "opt2", text: "Glucosa en ayunas >= 110 mg/dl", is_correct: false },
                    { id: "opt3", text: "Glucosa al azar >= 140 mg/dl", is_correct: false },
                    { id: "opt4", text: "Glucosa 2h post carga >= 180 mg/dl", is_correct: false }
                ])
            }
        ]

        for (const q of questionsData) {
            // Basic check to avoid duplication if running multiple times (naive check by text)
            const exists = await prisma.question.findFirst({ where: { text: q.text } })
            if (!exists) {
                await prisma.question.create({
                    data: {
                        text: q.text,
                        category_id: catInternal.id,
                        author_id: admin.id,
                        status: 'PUBLISHED',
                        options: q.options,
                        version: 1
                    }
                })
            }
        }

        // Create Exam
        console.log('Seeding exam...')
        const examTitle = "Examen Parcial Medicina Interna"
        const existingExam = await prisma.exam.findFirst({ where: { title: examTitle } })

        if (!existingExam) {
            // Need a course
            const course = await prisma.course.findFirst({ where: { code: "MED-001" } })

            await prisma.exam.create({
                data: {
                    title: examTitle,
                    course_id: course?.id,
                    categories: JSON.stringify([catInternal.id]),
                    created_by: admin.id,
                    duration_minutes: 60,
                    start_window: new Date(),
                    end_window: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
                    total_questions: 3,
                    rules: JSON.stringify({}),
                }
            })
        }
    }

    console.log('Seeding finished.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
