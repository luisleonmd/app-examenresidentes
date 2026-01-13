"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createResource } from "@/app/lib/resources"
import { Loader2, Plus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function UploadResourceDialog() {
    const [open, setOpen] = useState(false)
    const [type, setType] = useState("LINK")
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean, error?: string } | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setResult(null)

        const formData = new FormData(event.currentTarget)
        formData.set('type', type)

        const res = await createResource(formData)
        setResult(res)
        setIsLoading(false)

        if (res.success) {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar Recurso
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Recurso Académico</DialogTitle>
                    <DialogDescription>
                        Comparta documentos, enlaces o imágenes de rotaciones con los residentes.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" name="title" required placeholder="Ej: Temario 2026 o Cronograma" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="type">Tipo de Recurso</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ROTATION_IMAGE">Rotaciones (Imagen)</SelectItem>
                                <SelectItem value="DOCUMENT">Documentos (PDF/Word)</SelectItem>
                                <SelectItem value="LINK">Temario / Enlaces</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {type === "LINK" ? (
                        <div className="grid gap-2">
                            <Label htmlFor="url">URL del Enlace</Label>
                            <Input id="url" name="url" required placeholder="https://..." type="url" />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="file">Archivo</Label>
                            <Input id="file" name="file" type="file" required accept={type === 'ROTATION_IMAGE' ? "image/*" : ".pdf,.doc,.docx"} />
                            <p className="text-xs text-muted-foreground">Nota: El archivo se guardará en la base de datos (Max 5MB).</p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <Textarea id="description" name="description" placeholder="Breve descripción del contenido..." />
                    </div>

                    {result?.error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
