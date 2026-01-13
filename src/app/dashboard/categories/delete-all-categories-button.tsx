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
import { deleteAllCategories } from "@/app/lib/questions"
import { useRouter } from "next/navigation"

export function DeleteAllCategoriesButton() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setLoading(true)
        try {
            const result = await deleteAllCategories()

            if (result.success) {
                setOpen(false)
                router.refresh()
                alert(result.message)
            } else {
                alert(result.error || 'Error al eliminar todas las categorías')
            }
        } catch (error) {
            console.error('Delete all error:', error)
            alert('Error al eliminar todas las categorías')
        } finally {
            setLoading(false)
        }
    }

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="destructive" size="sm" disabled>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Todo
            </Button>
        )
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Todo
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p className="font-bold text-destructive">
                                ⚠️ ESTA ACCIÓN ES DESTRUCTIVA E IRREVERSIBLE
                            </p>
                            <p>
                                Vas a eliminar <strong>TODAS</strong> las categorías del sistema.
                            </p>
                            <p>
                                Como las preguntas dependen de las categorías, esta acción también eliminará:
                            </p>
                            <ul className="list-disc list-inside ml-4 font-medium text-foreground">
                                <li>TODAS las preguntas del banco de datos.</li>
                                <li>TODAS las imágenes asociadas a preguntas.</li>
                            </ul>
                            <p>
                                Si existen intentos de examen realizados por estudiantes, la operación fallará por seguridad.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? 'Eliminando todo...' : 'Sí, eliminar todo (Categorías y Preguntas)'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
