"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Database, FolderSync, Loader2 } from "lucide-react"
import { syncQuestionBank } from "@/app/lib/bank-sync"
import { JsonQuestion, fromJsonQuestion, UnifiedQuestion } from "@/types/questions"

export function SyncBankDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const handleSync = async () => {
        if (files.length === 0) {
            alert("Selecciona la carpeta del banco de preguntas primero.")
            return
        }

        setLoading(true)

        try {
            // 1. Filter only JSON files
            const jsonFiles = files.filter(f => f.name.endsWith('.json'))
            
            if (jsonFiles.length === 0) {
                throw new Error("No se encontraron archivos JSON en la carpeta seleccionada.")
            }

            // 2. Read and parse all files
            const parsedQuestions: UnifiedQuestion[] = []
            
            for (const file of jsonFiles) {
                try {
                    const text = await file.text()
                    const jsonContent = JSON.parse(text)
                    
                    // JSON can be an array of questions or a single question
                    const items: JsonQuestion[] = Array.isArray(jsonContent) ? jsonContent : [jsonContent]
                    
                    for (const item of items) {
                        // Validate basic shape
                        if (item.id && item.pregunta && item.opciones && item.respuesta_correcta) {
                            parsedQuestions.push(fromJsonQuestion(item))
                        }
                    }
                } catch (e) {
                    console.warn(`Error procesando archivo ${file.name}:`, e)
                }
            }

            if (parsedQuestions.length === 0) {
                throw new Error("No se encontraron preguntas válidas en los archivos JSON.")
            }

            // 3. Send to Server Action
            const result = await syncQuestionBank(parsedQuestions)

            if (result.success) {
                alert(`Sincronización completa: ${result.created} creadas, ${result.updated} actualizadas.`)
                setOpen(false)
                router.refresh()
            } else {
                alert(result.error || "Error al sincronizar el banco.")
            }
            
        } catch (error: any) {
            alert(error.message || "Error al procesar los archivos.")
            console.error(error)
        } finally {
            setLoading(false)
            setFiles([])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <FolderSync className="size-4" />
                    Sincronizar Banco (Carpeta)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database className="size-5 text-blue-600" />
                        Sincronizar Banco de Preguntas
                    </DialogTitle>
                    <DialogDescription>
                        Selecciona la carpeta <span className="font-semibold text-foreground">BancoPreguntas</span> entera. 
                        El sistema leerá todas las rotaciones (archivos JSON) y sincronizará la base de datos de manera automática.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="folder">Carpeta del Banco</Label>
                        <Input
                            id="folder"
                            type="file"
                            onChange={handleFileChange}
                            disabled={loading}
                            // @ts-ignore - webkitdirectory is non-standard but widely supported
                            webkitdirectory="true"
                            directory="true"
                            multiple
                        />
                        {files.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {files.length} archivos seleccionados.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSync} disabled={loading || files.length === 0} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sincronizando...
                            </>
                        ) : (
                            "Iniciar Sincronización"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
