"use client"

import { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateCategory } from "@/app/lib/questions"
import { useRouter } from "next/navigation"

interface EditCategoryButtonProps {
    id: string
    name: string
}

export function EditCategoryButton({ id, name }: EditCategoryButtonProps) {
    const [open, setOpen] = useState(false)
    const [newName, setNewName] = useState(name)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updateCategory(id, newName)

            if (result.success) {
                setOpen(false)
                router.refresh()
            } else {
                alert(result.error || 'Error al actualizar categoría')
            }
        } catch (error) {
            console.error('Update error:', error)
            alert('Error al actualizar categoría')
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
                <Pencil className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setNewName(name)}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Editar Categoría</DialogTitle>
                        <DialogDescription>
                            Modifica el nombre de la categoría. Los cambios se aplicarán a todas las preguntas asociadas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre de la categoría</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ej: Cardiología"
                                required
                                autoFocus
                            />
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
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
