"use client"

import { useState, useEffect } from "react"
import { getCategories } from "@/app/lib/questions"
import { uploadQuestionsFile } from "@/app/lib/import-actions"
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
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ImportQuestionsDialog() {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [categoryId, setCategoryId] = useState("")
    const [categories, setCategories] = useState<any[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [result, setResult] = useState<{ success: boolean, message: string, details?: string } | null>(null)

    useEffect(() => {
        getCategories().then(setCategories)
    }, [])

    async function handleUpload() {
        if (!file || !categoryId) return

        setIsUploading(true)
        setResult(null)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("categoryId", categoryId)

        try {
            const response = await uploadQuestionsFile(formData)
            setResult(response)
            if (response.success) {
                setFile(null)
                // We keep the dialog open to show the success message
            }
        } catch (error) {
            setResult({ success: false, message: "Error de conexión o servidor." })
            setResult({ success: false, message: "Error de conexión o servidor." })
        } finally {
            setIsUploading(false)
        }
    }

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="outline" className="gap-2" disabled>
                <Upload className="size-4" />
                Importar (Word/PDF)
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="size-4" />
                    Importar (Word/PDF)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Importar Preguntas</DialogTitle>
                    <DialogDescription>
                        Cargue un archivo (.docx o .pdf) con las preguntas estructuradas.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Categoría por defecto</Label>
                        <Select onValueChange={setCategoryId} value={categoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Archivo</Label>
                        <div className="flex items-center gap-2 border border-dashed rounded-md p-4 justify-center bg-gray-50 dark:bg-gray-900 cursor-pointer relative">
                            <input
                                type="file"
                                accept=".docx,.pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            <div className="text-center space-y-2 pointer-events-none">
                                <div className="flex justify-center">
                                    {file ? <FileText className="size-8 text-blue-500" /> : <Upload className="size-8 text-gray-400" />}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {file ? file.name : "Haga clic o arrastre un archivo aquí"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {result && (
                        <Alert variant={result.success ? "default" : "destructive"}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                            <AlertDescription>
                                {result.message}
                                {result.details && <div className="mt-2 text-xs font-mono bg-black/10 p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">{result.details}</div>}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleUpload} disabled={!file || !categoryId || isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUploading ? "Procesando..." : "Subir e Importar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
