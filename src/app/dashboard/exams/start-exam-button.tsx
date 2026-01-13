"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { startExam } from "@/app/lib/exam-taking"
import { useRouter } from "next/navigation"

export function StartExamButton({ examId, attempt }: { examId: string, attempt?: { id: string, status: string } | null }) {
    const router = useRouter()

    async function handleStart() {
        if (attempt?.id) {
            router.push(`/dashboard/exams/take/${attempt.id}`)
            return
        }

        const result = await startExam(examId)
        if (result.success && result.attemptId) {
            router.push(`/dashboard/exams/take/${result.attemptId}`)
        } else {
            alert(result.error)
        }
    }

    if (attempt?.status === 'SUBMITTED') {
        return (
            <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/exams/take/${attempt.id}/result`)} className="gap-2">
                Ver Resultados
            </Button>
        )
    }

    const isResume = attempt?.status === 'IN_PROGRESS'

    return (
        <Button size="sm" onClick={handleStart} className="gap-2" variant={isResume ? "secondary" : "default"}>
            <Play className="size-3" />
            {isResume ? "Continuar" : "Iniciar"}
        </Button>
    )
}
