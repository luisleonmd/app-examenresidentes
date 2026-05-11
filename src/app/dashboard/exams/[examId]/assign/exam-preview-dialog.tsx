"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, FileSearch, Loader2, CheckCircle, Trash2 } from "lucide-react"
import { generateExamPreview } from "@/app/lib/exam-taking"
import { deleteQuestion } from "@/app/lib/questions"
import { Badge } from "@/components/ui/badge"

export function ExamPreviewDialog({ examId, residentId, residentName, iconOnly = false }: { examId: string, residentId?: string, residentName?: string, iconOnly?: boolean }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [questions, setQuestions] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleOpen = async (isOpen: boolean) => {
        setOpen(isOpen)
        if (isOpen) {
            setLoading(true)
            setError(null)
            try {
                const preview = await generateExamPreview(examId, residentId)
                setQuestions(preview)
            } catch (err: any) {
                setError(err.message || "Error al generar la vista previa")
            } finally {
                setLoading(false)
            }
        } else {
            setQuestions([])
        }
    }

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar (deprecar) esta pregunta? No volverá a aparecer en ningún examen.")) {
            return
        }
        
        setDeletingId(questionId)
        try {
            const result = await deleteQuestion(questionId)
            if (result.success) {
                setQuestions(prev => prev.filter(q => q.id !== questionId))
            } else {
                alert(result.error || "Error al eliminar la pregunta")
            }
        } catch (error) {
            console.error("Error eliminando pregunta:", error)
            alert("Error inesperado al eliminar la pregunta")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                {iconOnly ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Vista Previa del Examen">
                        <FileSearch className="size-4" />
                    </Button>
                ) : (
                    <Button variant="outline" size="sm">
                        <FileSearch className="size-4 mr-2" />
                        Vista Previa
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {residentName ? `Vista Previa del Examen para ${residentName}` : "Vista Previa del Examen (General)"}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto pr-4 mt-4 space-y-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="size-8 animate-spin mb-4" />
                            <p>Generando simulación del examen...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md">
                            {error}
                        </div>
                    )}

                    {!loading && !error && questions.length > 0 && (
                        <div className="space-y-6">
                            <div className="text-sm text-muted-foreground mb-4">
                                Esta es una simulación de las {questions.length} preguntas que se generarían aleatoriamente basándose en la configuración actual. Si encuentras una pregunta incorrecta, puedes eliminarla del banco de preguntas usando el botón de papelera.
                            </div>
                            
                            {questions.map((q, idx) => (
                                <div key={q.id} className="border p-4 rounded-lg bg-card shadow-sm relative group">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            disabled={deletingId === q.id}
                                            title="Eliminar del banco de preguntas"
                                        >
                                            {deletingId === q.id ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="size-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 mb-4 pr-12">
                                        <span className="font-bold">{idx + 1}.</span>
                                        <div>
                                            <div className="mb-2 whitespace-pre-wrap">{q.text}</div>
                                            <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-6">
                                        {q.options.map((opt: any) => (
                                            <div 
                                                key={opt.id} 
                                                className={`p-3 rounded border text-sm flex justify-between ${
                                                    opt.is_correct ? "bg-green-50 dark:bg-green-900/20 border-green-200" : "bg-muted/30"
                                                }`}
                                            >
                                                <span>
                                                    <span className="font-bold mr-2">{opt.id})</span>
                                                    {opt.text}
                                                </span>
                                                {opt.is_correct && (
                                                    <CheckCircle className="size-4 text-green-600 flex-shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
