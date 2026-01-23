"use client"

import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteExam, deleteExamsByTitle } from "@/app/lib/exams"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function DeleteExamButton({ examId, examTitle, duplicateCount = 0 }: { examId: string, examTitle: string, duplicateCount?: number }) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const router = useRouter()

    async function handleDeleteSingle() {
        setLoading(true)
        const result = await deleteExam(examId)
        if (!result.success) {
            alert(result.error)
        } else {
            router.refresh()
            setOpen(false)
        }
        setLoading(false)
    }

    async function handleDeleteAll() {
        if (!confirm(`¿ESTÁ SEGURO? Esto borrará ${duplicateCount} exámenes con el nombre "${examTitle}".`)) return

        setLoading(true)
        const result = await deleteExamsByTitle(examTitle)
        if (!result.success) {
            alert(result.error)
        } else {
            alert(`Se han eliminado ${duplicateCount} copias.`)
            router.refresh()
            setOpen(false)
        }
        setLoading(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    size="sm"
                    variant="destructive"
                    disabled={loading}
                    title="Eliminar Examen"
                >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar Examen?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se borrarán los intentos y resultados asociados.
                        {duplicateCount > 1 && (
                            <div className="mt-4 p-3 bg-destuctive/10 text-destructive border border-destructive/20 rounded-md font-medium">
                                ⚠️ Atención: Se detectaron {duplicateCount} exámenes idénticos con este nombre.
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    {duplicateCount > 1 ? (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleDeleteSingle} disabled={loading}>
                                Borrar solo este (1)
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteAll} disabled={loading}>
                                Borrar TODAS las copias ({duplicateCount})
                            </Button>
                        </div>
                    ) : (
                        <Button variant="destructive" onClick={handleDeleteSingle} disabled={loading}>
                            Eliminar
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
