"use client"

import { useState } from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ViewQuestionDialogProps {
    question: {
        id: string
        text: string
        explanation: string | null
        options: string
        image_url?: string | null
        category: { name: string }
    }
}

export function ViewQuestionDialog({ question }: ViewQuestionDialogProps) {
    const [open, setOpen] = useState(false)

    let options: any[] = []
    try {
        options = JSON.parse(question.options)
    } catch (e) {
        options = []
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Eye className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Vista de Pregunta</DialogTitle>
                    <DialogDescription asChild>
                        <div className="text-sm text-muted-foreground mt-2">
                            <Badge variant="outline">{question.category.name}</Badge>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Question Text */}
                    <div>
                        <h3 className="font-semibold mb-2">Pregunta:</h3>
                        <MarkdownRenderer content={question.text} />
                    </div>

                    {/* Image if present */}
                    {question.image_url && (
                        <div>
                            <h3 className="font-semibold mb-2">Imagen:</h3>
                            <img
                                src={question.image_url}
                                alt="Question image"
                                className="max-w-full rounded border"
                            />
                        </div>
                    )}

                    {/* Options */}
                    <div>
                        <h3 className="font-semibold mb-2">Opciones:</h3>
                        <div className="space-y-2">
                            {options.map((opt) => (
                                <div
                                    key={opt.id}
                                    className={`p-3 rounded border ${opt.is_correct
                                        ? 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-800'
                                        : 'bg-muted'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="font-semibold">{opt.id}.</span>
                                        <span className="flex-1">{opt.text}</span>
                                        {opt.is_correct && (
                                            <Badge variant="default" className="bg-green-600">
                                                Correcta
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                        <div>
                            <h3 className="font-semibold mb-2">Justificación:</h3>
                            <MarkdownRenderer content={question.explanation} className="text-muted-foreground" />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
