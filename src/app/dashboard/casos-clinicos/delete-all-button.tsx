"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteOnlyAiQuestions } from "@/app/lib/delete-all-data"

export function DeleteAllQuestionsButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "¿Estás seguro de que deseas eliminar todos los casos clínicos generados por IA del banco? Las categorías, bibliografías y preguntas manuales no se verán afectadas."
        )

        if (!confirmed) return

        setLoading(true)
        try {
            const result = await deleteOnlyAiQuestions()
            if (result.success) {
                alert(`Limpieza exitosa. Se eliminaron ${result.deletedQuestions} preguntas del banco de Casos Clínicos IA.`)
                router.refresh()
            } else {
                alert(result.error || "Ocurrió un error al limpiar los datos.")
            }
        } catch (e: any) {
            alert("Error: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-2"
        >
            {loading ? (
                <>
                    <Loader2 className="size-4 animate-spin" />
                    Limpiando...
                </>
            ) : (
                <>
                    <Trash2 className="size-4" />
                    Eliminar Casos IA
                </>
            )}
        </Button>
    )
}
