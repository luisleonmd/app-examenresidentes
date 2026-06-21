"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UploadCloud, FileJson, FileText, Check, Loader2, AlertCircle, HelpCircle } from "lucide-react"
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
import { uploadQuestionsFile } from "@/app/lib/import-actions"
import { importQuestionsJSON } from "@/app/lib/json-import"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ImportToCategoryDialogProps {
    categoryId: string
    categoryName: string
}

export function ImportToCategoryDialog({ categoryId, categoryName }: ImportToCategoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [importType, setImportType] = useState<"file" | "json">("file")
    
    // File upload states
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    
    // JSON upload states
    const [jsonText, setJsonText] = useState("")
    const [isImportingJson, setIsImportingJson] = useState(false)
    
    // Result feedback
    const [result, setResult] = useState<{ success: boolean, message: string, details?: string } | null>(null)
    
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Reset state on dialog open/close
    useEffect(() => {
        if (!open) {
            setFile(null)
            setJsonText("")
            setResult(null)
            setIsUploading(false)
            setIsImportingJson(false)
        }
    }, [open])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null
        setFile(selectedFile)
        setResult(null)
    }

    const handleImportFile = async () => {
        if (!file) return
        setIsUploading(true)
        setResult(null)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("categoryId", categoryId)

        try {
            const res = await uploadQuestionsFile(formData)
            setResult({
                success: res.success,
                message: res.message,
                details: res.details
            })
            if (res.success) {
                setFile(null)
                router.refresh()
                // Auto close on success after a short delay
                setTimeout(() => setOpen(false), 2500)
            }
        } catch (error) {
            setResult({ success: false, message: "Error al cargar e importar el archivo." })
        } finally {
            setIsUploading(false)
        }
    }

    const handleImportJson = async () => {
        if (!jsonText.trim()) return
        setIsImportingJson(true)
        setResult(null)

        try {
            const res = await importQuestionsJSON(jsonText, { overrideCategoryId: categoryId })
            setResult({
                success: res.success,
                message: res.message || (res.error as string),
                details: res.errors && res.errors.length > 0 ? res.errors.join("\n") : undefined
            })
            if (res.success) {
                setJsonText("")
                router.refresh()
                // Auto close on success after a short delay
                setTimeout(() => setOpen(false), 2500)
            }
        } catch (error) {
            setResult({ success: false, message: "Error al procesar el JSON." })
        } finally {
            setIsImportingJson(false)
        }
    }

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                <UploadCloud className="h-4 w-4" />
            </Button>
        )
    }

    const isLoading = isUploading || isImportingJson

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Importar preguntas directamente"
                >
                    <UploadCloud className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-900">
                        <UploadCloud className="size-5 text-blue-600" />
                        Importar preguntas a: <span className="font-bold underline">{categoryName}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Sube preguntas directamente a esta categoría usando archivos Word (.docx), PDF o formato JSON.
                    </DialogDescription>
                </DialogHeader>

                {/* Form Selection Tabs */}
                <div className="flex border-b border-slate-100 mb-4">
                    <button
                        onClick={() => {
                            setImportType("file")
                            setResult(null)
                        }}
                        className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                            importType === "file"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        disabled={isLoading}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            <FileText className="size-4" />
                            Word (.docx) / PDF
                        </span>
                    </button>
                    <button
                        onClick={() => {
                            setImportType("json")
                            setResult(null)
                        }}
                        className={`flex-1 pb-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                            importType === "json"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                        disabled={isLoading}
                    >
                        <span className="flex items-center justify-center gap-1.5">
                            <FileJson className="size-4" />
                            JSON
                        </span>
                    </button>
                </div>

                <div className="space-y-4 py-2">
                    {importType === "file" ? (
                        /* Word / PDF Form */
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="file-select">Selecciona el archivo (.docx o .pdf)</Label>
                                <div className="flex items-center gap-2 border border-dashed rounded-md p-6 justify-center bg-slate-50 hover:bg-slate-100/50 cursor-pointer relative transition-colors">
                                    <input
                                        id="file-select"
                                        type="file"
                                        accept=".docx,.pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        disabled={isLoading}
                                    />
                                    <div className="text-center space-y-2 pointer-events-none">
                                        <div className="flex justify-center">
                                            {file ? (
                                                <FileText className="size-10 text-blue-600" />
                                            ) : (
                                                <UploadCloud className="size-10 text-slate-400" />
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">
                                            {file ? file.name : "Haz clic o arrastra un archivo aquí"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Soporta archivos .docx de Word y .pdf
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Format Guide Alert */}
                            <Alert className="bg-slate-50 border-slate-200">
                                <HelpCircle className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-xs font-bold text-slate-700">Formato del Documento</AlertTitle>
                                <AlertDescription className="text-[11px] text-muted-foreground space-y-1">
                                    <p>Las preguntas en el archivo deben seguir el siguiente formato:</p>
                                    <pre className="mt-1 bg-slate-100 p-2 rounded text-[10px] font-mono text-slate-800">
                                        {`1. ¿Cuál es el órgano más grande del cuerpo humano?
a) El cerebro
b) La piel*
c) El hígado
d) Los pulmones`}
                                    </pre>
                                    <p className="mt-1">
                                        *Indica la respuesta correcta con un asterisco (<code className="bg-slate-100 px-0.5 rounded">*</code>) al final o la palabra <code className="bg-slate-100 px-0.5 rounded">(correcta)</code>.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        /* JSON Form */
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="json-text">Pegar JSON o cargar archivo</Label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept=".json"
                                        id="json-file"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                const reader = new FileReader()
                                                reader.onload = (event) => {
                                                    setJsonText(event.target?.result as string)
                                                }
                                                reader.readAsText(file)
                                            }
                                        }}
                                        disabled={isLoading}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => document.getElementById("json-file")?.click()}
                                        disabled={isLoading}
                                        className="text-xs"
                                    >
                                        <FileJson className="size-4 mr-1.5" />
                                        Cargar Archivo .json
                                    </Button>
                                    {jsonText && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setJsonText("")}
                                            disabled={isLoading}
                                            className="text-xs text-red-500"
                                        >
                                            Limpiar
                                        </Button>
                                    )}
                                </div>
                                <Textarea
                                    id="json-text"
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                    placeholder={`[
  {
    "text": "¿Pregunta?",
    "explanation": "Explicación opcional...",
    "options": [
      { "text": "Opción A", "is_correct": false },
      { "text": "Opción B", "is_correct": true }
    ]
  }
]`}
                                    className="font-mono text-xs h-40 mt-2"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    )}

                    {/* Result alert */}
                    {result && (
                        <Alert variant={result.success ? "default" : "destructive"} className={result.success ? "bg-green-50 border-green-200 text-green-800" : ""}>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                            <AlertDescription className="text-xs max-h-32 overflow-y-auto">
                                <p className="font-semibold">{result.message}</p>
                                {result.details && (
                                    <pre className="mt-2 p-1.5 bg-black/5 rounded text-[10px] whitespace-pre-wrap font-mono">
                                        {result.details}
                                    </pre>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    {importType === "file" ? (
                        <Button
                            onClick={handleImportFile}
                            disabled={!file || isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Importando...
                                </>
                            ) : (
                                "Subir e Importar"
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleImportJson}
                            disabled={!jsonText.trim() || isLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isImportingJson ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                "Importar JSON"
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
