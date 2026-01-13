import { auth } from "@/auth"
import { getExams } from "@/app/lib/exams"
import { redirect } from "next/navigation"
import { getCategories } from "@/app/lib/questions"
import { AssignmentInterface } from "./assignment-interface"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function AssignPage(props: { params: Promise<{ examId: string }> }) {
    const params = await props.params
    const session = await auth()
    if (!session?.user || session.user.role !== 'COORDINADOR') {
        redirect('/dashboard')
    }

    const examId = params.examId

    // Fetch Data
    const exam = await prisma.exam.findUnique({ where: { id: examId } })
    const users = await prisma.user.findMany({
        where: { role: 'RESIDENTE' },
        orderBy: { nombre: 'asc' }
    })
    const categories = await getCategories()
    const profiles = await prisma.examProfile.findMany({ where: { exam_id: examId } })

    if (!exam) return <div>Examen no encontrado</div>

    // Build map of existing profiles
    const profilesMap = new Map()
    profiles.forEach(p => {
        profilesMap.set(p.user_id, JSON.parse(p.configuration))
    })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Asignación de Temas: {exam.title}</h1>
            <AssignmentInterface
                examId={examId}
                users={users}
                categories={categories}
                initialProfiles={profilesMap}
            />
        </div>
    )
}
