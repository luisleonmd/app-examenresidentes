
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting Simulation Cleanup...')

    const categoryId = "sim-category-01"

    // 1. Delete Claims/Answers/Attempts linked to Simulation Exams
    // Identify Simulation Exams by Title prefix
    const simExams = await prisma.exam.findMany({
        where: { title: { startsWith: "[SIMULACION]" } },
        select: { id: true }
    })
    const simExamIds = simExams.map(e => e.id)

    if (simExamIds.length > 0) {
        console.log(`Found ${simExamIds.length} simulation exams. Cleaning up related data...`)

        // Find Attempts
        const attempts = await prisma.examAttempt.findMany({
            where: { exam_id: { in: simExamIds } },
            select: { id: true }
        })
        const attemptIds = attempts.map(a => a.id)

        if (attemptIds.length > 0) {
            // Delete Claims
            await prisma.claim.deleteMany({ where: { attempt_id: { in: attemptIds } } })
            // Delete Answers
            await prisma.answer.deleteMany({ where: { attempt_id: { in: attemptIds } } })
            // Delete Attempts
            await prisma.examAttempt.deleteMany({ where: { id: { in: attemptIds } } })
        }

        // Delete ExamProfiles
        await prisma.examProfile.deleteMany({ where: { exam_id: { in: simExamIds } } })

        // Delete Exams
        await prisma.exam.deleteMany({ where: { id: { in: simExamIds } } })
    }

    // 2. Delete Questions (Must be before users because users are authors)
    console.log('Deleting Simulation Questions...')
    await prisma.question.deleteMany({
        where: { category_id: categoryId }
    })

    // 3. Delete Simulation Users
    // Identify by prefix 'sim_resident_'
    console.log('Deleting Simulation Users...')
    // Note: This will cascade delete any remaining relations if schema configured so, but we did manual cleanup above to be safe/thorough.
    // Also delete Sim Admin
    await prisma.user.deleteMany({
        where: {
            OR: [
                { cedula: { startsWith: "sim_resident_" } },
                { cedula: "sim_admin_00" }
            ]
        }
    })

    // 4. Delete Category
    console.log('Deleting Simulation Category...')
    try {
        await prisma.questionCategory.delete({
            where: { id: categoryId }
        })
    } catch (e) {
        console.log("Category might already be gone or in use (should not happen)")
    }

    console.log('Simulation Cleanup Completed Successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
