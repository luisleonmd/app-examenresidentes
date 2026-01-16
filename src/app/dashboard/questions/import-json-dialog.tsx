"use client"

import { useState, useEffect } from "react"
import { Upload, FileText, Plus } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { importQuestionsJSON } from "@/app/lib/json-import"
import { getCategories } from "@/app/lib/questions"

export function ImportJSONDialog() {
    const [open, setOpen] = useState(false)
    const [jsonText, setJsonText] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [mounted, setMounted] = useState(false)

    // Category Selection State
    const [categories, setCategories] = useState<any[]>([])
    const [importMode, setImportMode] = useState<"json" | "existing" | "new">("json")
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
    const [newCategoryName, setNewCategoryName] = useState("")

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (open) {
            getCategories().then(setCategories)
            setResult(null)
            setImportMode("json")
            setSelectedCategoryId("")
            setNewCategoryName("")
        }
    }, [open])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setJsonText(event.target?.result as string)
            }
            reader.readAsText(file)
        }
    }

    const handleImport = async () => {
        if (!jsonText.trim()) {
            alert("Por favor ingrese o cargue un archivo JSON")
            return
        }

        if (importMode === "existing" && !selectedCategoryId) {
            alert("Seleccione una categoría existente")
            return
        }
        if (importMode === "new" && !newCategoryName.trim()) {
            alert("Ingrese el nombre de la nueva categoría")
            return
        }

        setLoading(true)
        setResult(null)

        const options = {
            overrideCategoryId: importMode === "existing" ? selectedCategoryId : (importMode === "json" ? "json" : undefined),
            newCategoryName: importMode === "new" ? newCategoryName : undefined
        }

        try {
            const response = await importQuestionsJSON(jsonText, options)
            setResult(response)

            if (response.success && (!response.errors || response.errors.length === 0)) {
                setTimeout(() => {
                    setOpen(false)
                    setJsonText("")
                    setResult(null)
                }, 2000)
            }
        } catch (err) {
            setResult({ success: false, error: "Error de conexión o timeout. Intente con menos preguntas." })
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button variant="outline">
                <FileText className="mr-2 size-4" />
                Importar JSON
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileText className="mr-2 size-4" />
                    Importar JSON
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar Preguntas desde JSON</DialogTitle>
                    <DialogDescription>
                        Cargue un archivo JSON y seleccione cómo organizar las preguntas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>1. Archivo PDF / Texto</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="file-upload" className="text-xs text-muted-foreground mb-1 block">Subir Archivo (.json)</Label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    className="block w-full text-xs text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-xs file:font-semibold
                                        file:bg-primary file:text-primary-foreground
                                        hover:file:bg-primary/90"
                                />
                            </div>
                        </div>
                        <Textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder='[{"text": "Pregunta...", "category": "...", "options": [...]}]'
                            className="font-mono text-xs h-32 mt-2"
                        />
                    </div>

                    <div className="space-y-3 bg-muted/30 p-4 rounded-md border">
                        <Label>2. Asignación de Categoría</Label>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Button
                                type="button"
                                variant={importMode === "json" ? "default" : "outline"}
                                className="text-xs justify-start"
                                onClick={() => setImportMode("json")}
                            >
                                <FileText className="mr-2 size-3" />
                                Usar del JSON
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

                        {importMode === "json" && (
                            <p className="text-xs text-muted-foreground">
                                Se usarán las categorías definidas dentro de cada objeto en el archivo JSON. Si no existe, se creará.
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

                    {result && (
                        <div className={`p-4 rounded-md text-sm ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            <p className="font-semibold">{result.message || result.error}</p>
                            {result.errors && result.errors.length > 0 && (
                                <ul className="mt-2 text-xs list-disc list-inside max-h-32 overflow-y-auto">
                                    {result.errors.map((err: string, idx: number) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleImport} disabled={loading}>
                        {loading ? "Importando..." : "Importar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
