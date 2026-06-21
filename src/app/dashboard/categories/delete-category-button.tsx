"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface DeleteCategoryButtonProps {
    id: string
    name: string
    questionCount: number
}

export function DeleteCategoryButton({ id, name, questionCount }: DeleteCategoryButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleDelete = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/categories?categoryId=${id}`, {
                method: "DELETE"
            })

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}))
                throw new Error(errData.error || `HTTP error! status: ${response.status}`)
            }

            const result = await response.json()
            if (result.success) {
                setOpen(false)
                router.refresh()
            } else {
                alert(result.error || "Error al eliminar la categoría.")
            }
        } catch (error: any) {
            console.error("Failed to delete category:", error)
            alert(error instanceof Error ? error.message : String(error))
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <Trash2 className="size-4" />
            </Button>
        )
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Trash2 className="size-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar categoría "{name}"?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>Esta acción es <strong>permanente</strong> y eliminará:</p>
                            <ul className="list-disc list-inside ml-4">
                                <li>La categoría <strong>{name}</strong></li>
                                <li><strong>{questionCount}</strong> pregunta{questionCount !== 1 ? 's' : ''} asociada{questionCount !== 1 ? 's' : ''}</li>
                            </ul>
                            <p className="text-destructive font-semibold mt-4">
                                Esta operación no se puede deshacer.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {loading ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
