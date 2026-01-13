"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, FileCode } from "lucide-react"
import { importMoodleXML } from "@/app/lib/moodle-import"

export function ImportMoodleDialog() {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<FileList | null>(null)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(e.target.files)
        }
    }

    const handleImport = async () => {
        if (!files || files.length === 0) return

        setLoading(true)
        let totalCount = 0
        let successCount = 0
        let errorCount = 0
        let errors: string[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            try {
                const text = await file.text()
                const result = await importMoodleXML(text)

                if (result.success && result.count) {
                    totalCount += result.count
                    successCount++
                } else {
                    errorCount++
                    errors.push(`${file.name}: ${result.error}`)
                }
            } catch (err) {
                errorCount++
                errors.push(`${file.name}: Error de lectura`)
            }
        }

        setLoading(false)

        let message = `Proceso completado.\n`
        message += `Archivos procesados: ${successCount}\n`
        message += `Preguntas importadas: ${totalCount}\n`

        if (errorCount > 0) {
            message += `\nErrores (${errorCount} archivos):\n`
            message += errors.join('\n').slice(0, 200) + (errors.join('\n').length > 200 ? '...' : '')
        }

        alert(message)

        if (successCount > 0) {
            setOpen(false)
            setFiles(null)
            // Optional: refresh page logic is in the server action revalidatePath
        }
    }

    if (!mounted) {
        return (
            <Button variant="outline" className="gap-2" disabled>
                <FileCode className="size-4" />
                Importar Moodle XML
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileCode className="size-4" />
                    Importar Moodle XML
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Importar Preguntas (Moodle XML)</DialogTitle>
                    <DialogDescription>
                        Seleccione uno o varios archivos XML exportados de Moodle.
                        También puede seleccionar todos los archivos de una carpeta.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="xml-file">Archivos XML</Label>
                        <Input
                            id="xml-file"
                            type="file"
                            accept=".xml"
                            multiple
                            onChange={handleFileChange}
                        />
                        {files && files.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {files.length} archivo{files.length !== 1 ? 's' : ''} seleccionado{files.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleImport} disabled={!files || loading}>
                        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        {loading ? `Importando (${files?.length})...` : 'Importar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
