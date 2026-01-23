"use client"

import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { deleteExam } from "@/app/lib/exams"
import { useState } from "react"
import { Loader2 } from "lucide-react"

import { useRouter } from "next/navigation"

export function DeleteExamButton({ examId }: { examId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        if (!confirm("¿Está seguro de que desea eliminar este examen? Esta acción no se puede deshacer y borrará todos los intentos y reclamos asociados.")) {
            return
        }

        setLoading(true)
        const result = await deleteExam(examId)
        if (!result.success) {
            alert(result.error)
        } else {
            alert("Examen eliminado correctamente.")
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            title="Eliminar Examen"
        >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
        </Button>
    )
}
