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
import { Upload, Loader2, FileCode, Plus } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { importMoodleXML } from "@/app/lib/moodle-import"
import { getCategories } from "@/app/lib/questions"

export function ImportMoodleDialog() {
    const [open, setOpen] = useState(false)
    const [files, setFiles] = useState<FileList | null>(null)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Category Selection State
    const [categories, setCategories] = useState<any[]>([])
    const [importMode, setImportMode] = useState<"xml" | "existing" | "new">("xml")
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
    const [newCategoryName, setNewCategoryName] = useState("")

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (open) {
            getCategories().then(setCategories)
            setImportMode("xml")
            setSelectedCategoryId("")
            setNewCategoryName("")
            setFiles(null)
        }
    }, [open])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(e.target.files)
        }
    }

    const handleImport = async () => {
        if (!files || files.length === 0) return

        if (importMode === "existing" && !selectedCategoryId) {
            alert("Seleccione una categoría existente")
            return
        }
        if (importMode === "new" && !newCategoryName.trim()) {
            alert("Ingrese el nombre de la nueva categoría")
            return
        }

        setLoading(true)
        let totalCount = 0
        let successCount = 0
        let errorCount = 0
        let errors: string[] = []

        const options = {
            overrideCategoryId: importMode === "existing" ? selectedCategoryId : (importMode === "xml" ? "xml" : undefined),
            newCategoryName: importMode === "new" ? newCategoryName : undefined
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            try {
                const text = await file.text()
                const result = await importMoodleXML(text, options)

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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar Preguntas (Moodle XML)</DialogTitle>
                    <DialogDescription>
                        Seleccione uno o varios archivos XML exportados de Moodle.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">

                    <div className="space-y-3 bg-muted/30 p-4 rounded-md border">
                        <Label>1. Asignación de Categoría</Label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Button
                                type="button"
                                variant={importMode === "xml" ? "default" : "outline"}
                                className="text-xs justify-start"
                                onClick={() => setImportMode("xml")}
                            >
                                <FileCode className="mr-2 size-3" />
                                Usar del XML
                            </Button>
                            <Button
                                type="button"
                                variant={importMode === "existing" ? "default" : "outline"}
                                className="text-xs justify-start"
                                onClick={() => setImportMode("existing")}
                            >
                                <Upload className="mr-2 size-3" />
                                Existente
                            </Button>
                            <Button
                                type="button"
                                variant={importMode === "new" ? "default" : "outline"}
                                className="text-xs justify-start"
                                onClick={() => setImportMode("new")}
                            >
                                <Plus className="mr-2 size-3" />
                                Nueva
                            </Button>
                        </div>

                        {importMode === "xml" && (
                            <p className="text-xs text-muted-foreground">
                                Se usarán las categorías definidas dentro de cada pregunta en el archivo XML.
                            </p>
                        )}

                        {importMode === "existing" && (
                            <div className="space-y-2">
                                <Label className="text-xs">Seleccione Categoría</Label>
                                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione una categoría..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {importMode === "new" && (
                            <div className="space-y-2">
                                <Label className="text-xs">Nombre de la Nueva Categoría</Label>
                                <Input
                                    placeholder="Ej. Medicina Interna 2024"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="xml-file">2. Archivos XML</Label>
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
