"use client"

import { useState, useEffect } from "react"
import { Upload, FileText } from "lucide-react"
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
import { importQuestionsJSON } from "@/app/lib/json-import"

export function ImportJSONDialog() {
    const [open, setOpen] = useState(false)
    const [jsonText, setJsonText] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ...
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

        setLoading(true)
        setResult(null)

        const response = await importQuestionsJSON(jsonText)
        setResult(response)
        setLoading(false)

        if (response.success) {
            setTimeout(() => {
                setOpen(false)
                setJsonText("")
                setResult(null)
            }, 3000)
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
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Importar Preguntas desde JSON</DialogTitle>
                    <DialogDescription>
                        Cargue un archivo JSON o pegue el contenido directamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="file-upload">Cargar archivo JSON</Label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="mt-2 block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-primary file:text-primary-foreground
                                hover:file:bg-primary/90"
                        />
                    </div>

                    <div>
                        <Label htmlFor="json-text">O pegue el JSON aquí</Label>
                        <Textarea
                            id="json-text"
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder='[{"text": "Pregunta?", "category": "Categoría", "options": [...]}]'
                            className="mt-2 font-mono text-xs h-64"
                        />
                    </div>

                    {result && (
                        <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            <p className="font-semibold">{result.message || result.error}</p>
                            {result.errors && result.errors.length > 0 && (
                                <ul className="mt-2 text-sm list-disc list-inside">
                                    {result.errors.slice(0, 5).map((err: string, idx: number) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                    {result.errors.length > 5 && (
                                        <li>... y {result.errors.length - 5} errores más</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
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
