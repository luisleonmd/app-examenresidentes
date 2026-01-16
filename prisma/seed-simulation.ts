
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting Simulation Seed...')

    // 1. Create Safe Category
    const categoryName = "SIMULACION_ESTRES"
    const categoryId = "sim-category-01"

    console.log('Creating Category:', categoryName)
    await prisma.questionCategory.upsert({
        where: { id: categoryId }, // Assuming ID is uuid but we can force it for consistency in cleanup, or we findByName
        create: {
            id: categoryId,
            name: categoryName,
            description: "Categoría exclusiva para pruebas de carga. NO USAR EN PRODUCCIÓN."
        },
        update: {}
    })

    // 2. Create 300 Questions
    console.log('Generating 300 Questions...')
    const questionsData = []
    for (let i = 1; i <= 300; i++) {
        questionsData.push({
            text: `[SIMULACION] Pregunta de prueba de carga #${i}. Estimar el manejo adecuado para el caso clínico presentado.`,
            category_id: categoryId,
            author_id: "user_sim_admin", // We need an author. Let's create a sim admin or use existing. Better create sim admin.
            status: 'PUBLISHED',
            options: JSON.stringify([
                { id: "opt1", text: "Opción Correcta Simulada A", is_correct: true },
                { id: "opt2", text: "Opción Incorrecta Simulada B", is_correct: false },
                { id: "opt3", text: "Opción Incorrecta Simulada C", is_correct: false },
                { id: "opt4", text: "Opción Incorrecta Simulada D", is_correct: false }
            ]),
            version: 1
        })
    }

    // Ensure Sim Admin exists
    const hashedPassword = await bcrypt.hash('sim123', 10)
    const simAdmin = await prisma.user.upsert({
        where: { cedula: 'sim_admin_00' },
        create: {
            id: 'user_sim_admin',
            cedula: 'sim_admin_00',
            nombre: 'Admin Simulación',
            role: 'COORDINADOR',
            password_hash: hashedPassword,
            active: true
        },
        update: {}
    })

    // Bulk create questions? Prisma doesn't support createMany for relations easily if not simple.
    // Question table has simple fields. createMany is supported.
    // Note: author_id key needs to exist.
    await prisma.question.createMany({
        data: questionsData.map(q => ({
            ...q,
            author_id: simAdmin.id
        }))
    })

    // 3. Create 50 Users
    console.log('Creating 50 Simulation Users...')
    const usersData = []
    for (let i = 1; i <= 50; i++) {
        const num = i.toString().padStart(2, '0')
        usersData.push({
            id: `user_sim_resident_${num}`,
            cedula: `sim_resident_${num}`, // Username for login
            nombre: `Residente Simulado ${num}`,
            role: 'RESIDENTE',
            password_hash: hashedPassword,
            cohort: 'R1',
            active: true
        })
    }

    /* 
       We cannot use createMany for Users easily if we want to be safe with unique constraints blindly, 
       but here we know IDs are unique 'user_sim_resident_XX'.
       Prisma createMany is supported for User model.
    */
    // We use a try/catch or deleteMany first in cleanup script. Ideally we assume clean slate or unique IDs.
    // Let's iterate upsert to be safe or just createMany and catch error if they exist.
    // Upsert is safer for re-runs without cleanup.
    for (const u of usersData) {
        await prisma.user.upsert({
            where: { id: u.id },
            create: u,
            update: {}
        })
    }

    // 4. Create 50 Exams (One per user, Personalized)
    console.log('Creating 50 Exams...')
    const startDate = new Date()
    const endDate = new Date()
    endDate.setHours(endDate.getHours() + 4) // 4 hours window

    for (let i = 1; i <= 50; i++) {
        const num = i.toString().padStart(2, '0')
        const userId = `user_sim_resident_${num}`

        // Create the Exam
        const exam = await prisma.exam.create({
            data: {
                title: `[SIMULACION] Examen Residente ${num}`,
                created_by: simAdmin.id,
                duration_minutes: 60,
                start_window: startDate,
                end_window: endDate,
                total_questions: 10, // Small exam for test? Or full 300? 
                // Request said "agregar 300 preguntas... de donde se generan 50 examenes".
                // Usually exams are subset. Let's say 50 questions per exam.
                categories: JSON.stringify([categoryId]),
                rules: JSON.stringify({}),
                // Directly assign to the user via Profile (or just general availability, but "diferentes para 50 residentes" implies assignment or randomization)
            }
        })

        // Assign to user specifically to ensure "diferentes" logic is exercised via ExamProfile if needed, 
        // OR just rely on standard random generation per user.
        // The prompt says "50 examenes diferentes para 50 residentes... son citados".
        // Let's create an ExamProfile for each user to force them to take THAT exam instance.
        // Actually, if we create 50 separate EXAM records, we just assign each exam to one user via an Enrollment logic 
        // OR we just assume they see "their" exam.
        // Let's use ExamProfile to map Exam X to User X specifically.

        await prisma.examProfile.create({
            data: {
                exam_id: exam.id,
                user_id: userId,
                // Configuration to pull 50 questions from the 300
                configuration: JSON.stringify([{ categoryId: categoryId, count: 50 }])
            }
        })
    }

    console.log('Simulation Seed Completed Successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
