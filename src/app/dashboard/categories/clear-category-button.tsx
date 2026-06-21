"use client"

import { useState } from "react"
import { Trash2, Loader2, Eraser } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

interface ClearCategoryButtonProps {
    id: string
    name: string
    questionCount: number
}

export function ClearCategoryButton({ id, name, questionCount }: ClearCategoryButtonProps) {
    const [open, setOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const response = await fetch(`/api/questions?categoryId=${id}`, {
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
                alert(result.error || "Error al vaciar la categoría.")
            }
        } catch (error: any) {
            console.error("Failed to clear category:", error)
            alert(error instanceof Error ? error.message : String(error))
        } finally {
            setIsDeleting(false)
        }
    }

    if (questionCount === 0) return null

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                                <Eraser className="h-4 w-4" />
                                <span className="sr-only">Vaciar categoría</span>
                            </Button>
                        </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Vaciar categoría (Borrar preguntas)</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Está seguro de vaciar esta categoría?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción eliminará permanentemente las <strong>{questionCount} preguntas</strong> en la categoría <strong>"{name}"</strong>.
                        <br /><br />
                        La categoría en sí NO será eliminada.
                        <br />
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isDeleting}
                        className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Borrando...
                            </>
                        ) : (
                            <>
                                <Eraser className="mr-2 h-4 w-4" />
                                Vaciar Categoría
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
