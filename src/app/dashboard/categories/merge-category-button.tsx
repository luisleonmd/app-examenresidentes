"use client"

import { useState, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { mergeCategoryInto } from "@/app/lib/questions"
import { useRouter } from "next/navigation"

interface MergeCategoryButtonProps {
    categoryId: string
    categoryName: string
    questionCount: number
    allCategories: Array<{ id: string; name: string }>
}

export function MergeCategoryButton({
    categoryId,
    categoryName,
    questionCount,
    allCategories
}: MergeCategoryButtonProps) {
    const [open, setOpen] = useState(false)
    const [targetCategoryId, setTargetCategoryId] = useState("")
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Filter out current category
    const availableCategories = allCategories.filter(cat => cat.id !== categoryId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!targetCategoryId) {
            alert('Por favor selecciona una categoría de destino')
            return
        }

        setLoading(true)

        try {
            const result = await mergeCategoryInto(categoryId, targetCategoryId)

            if (result.success) {
                alert(result.message)
                setOpen(false)
                router.refresh()
            } else {
                alert(result.error || 'Error al mover preguntas')
            }
        } catch (error) {
            console.error('Merge error:', error)
            alert('Error al mover preguntas')
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled
            >
                <ArrowRight className="h-4 w-4" />
            </Button>
        )
    }

    if (availableCategories.length === 0) {
        return null // No other categories to merge into
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Mover preguntas a otra categoría"
                >
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Mover Preguntas a Otra Categoría</DialogTitle>
                        <DialogDescription>
                            Todas las {questionCount} pregunta(s) de <strong>{categoryName}</strong> se moverán
                            a la categoría seleccionada. La categoría <strong>{categoryName}</strong> será eliminada.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="target">Categoría de destino</Label>
                            <Select
                                value={targetCategoryId}
                                onValueChange={setTargetCategoryId}
                                required
                            >
                                <SelectTrigger id="target">
                                    <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="rounded-lg bg-muted p-3 text-sm">
                            <p className="font-medium mb-1">⚠️ Esta acción:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>Moverá {questionCount} pregunta(s)</li>
                                <li>Eliminará la categoría "{categoryName}"</li>
                                <li>No se puede deshacer</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !targetCategoryId}>
                            {loading ? 'Moviendo...' : 'Mover preguntas'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
