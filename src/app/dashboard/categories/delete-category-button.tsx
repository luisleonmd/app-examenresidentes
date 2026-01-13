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
import { deleteCategory } from "@/app/lib/categories"

interface DeleteCategoryButtonProps {
    id: string
    name: string
    questionCount: number
}

export function DeleteCategoryButton({ id, name, questionCount }: DeleteCategoryButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleDelete = async () => {
        setLoading(true)
        const result = await deleteCategory(id)
        setLoading(false)

        if (result.success) {
            setOpen(false)
        } else {
            alert(result.error)
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
