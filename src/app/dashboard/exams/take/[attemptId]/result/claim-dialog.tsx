"use client"

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
import { useState } from "react"
import { createClaim } from "@/app/lib/claims"
import { AlertTriangle, Loader2 } from "lucide-react"

interface ClaimDialogProps {
    attemptId: string
    questionId: string
    questionText: string
}

export function ClaimDialog({ attemptId, questionId, questionText }: ClaimDialogProps) {
    const [open, setOpen] = useState(false)
    const [justification, setJustification] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!justification) {
            alert("La justificación es obligatoria")
            return
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('attemptId', attemptId)
        formData.append('questionId', questionId)
        formData.append('justification', justification)
        // Bibliography is now handled via file attachment, but keeping field as optional text if needed or just empty
        formData.append('bibliography', "Adjunto")
        if (file) {
            formData.append('file', file)
        }

        const result = await createClaim(formData)
        setLoading(false)

        if (result.success) {
            alert("Impugnación enviada correctamente")
            setOpen(false)
            setJustification("")
            setFile(null)
            window.location.reload()
        } else {
            alert(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <AlertTriangle className="size-4 mr-2" />
                    Formulación de Reclamo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Formulación de Reclamo</DialogTitle>
                    <DialogDescription>
                        Presente su reclamo justificado para la siguiente pregunta:
                        <br />
                        <span className="font-medium italic mt-2 block">"{questionText.substring(0, 100)}{questionText.length > 100 ? "..." : ""}"</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="justification">Justificación Técnica</Label>
                        <Textarea
                            id="justification"
                            placeholder="Explique por qué considera que la pregunta/respuesta es incorrecta..."
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="file">Bibliografía de Soporte (Documento/Video/HTML)</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".pdf,.doc,.docx,.html,.htm,.mp4,.mov,.txt"
                            onChange={(e) => {
                                const files = e.target.files
                                if (files && files.length > 0) {
                                    setFile(files[0])
                                }
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Formatos soportados: PDF, Word, HTML, Video.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Enviar Impugnación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
