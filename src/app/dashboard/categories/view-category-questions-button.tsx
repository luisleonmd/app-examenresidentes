"use client"

import { useState, useEffect } from "react"
import { Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { getQuestions } from "@/app/lib/questions"
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface ViewCategoryQuestionsButtonProps {
    categoryId: string
    categoryName: string
    questionCount: number
}

export function ViewCategoryQuestionsButton({
    categoryId,
    categoryName,
    questionCount
}: ViewCategoryQuestionsButtonProps) {
    const [open, setOpen] = useState(false)
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (open && questions.length === 0) {
            fetchQuestions()
        }
    }, [open])

    const fetchQuestions = async () => {
        setLoading(true)
        try {
            const data = await getQuestions(categoryId)
            setQuestions(data)
        } catch (error) {
            console.error("Failed to fetch questions:", error)
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled
            >
                <Eye className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Ver preguntas"
                    disabled={questionCount === 0}
                >
                    <Eye className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Preguntas de {categoryName}</DialogTitle>
                    <DialogDescription>
                        Vista previa de las {questionCount} preguntas en esta categoría.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No hay preguntas en esta categoría.
                        </div>
                    ) : (
                        <ScrollArea className="h-[60vh] pr-4">
                            <div className="space-y-6">
                                {questions.map((question, index) => {
                                    const options = JSON.parse(question.options as string)
                                    return (
                                        <div key={question.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <Badge variant="outline" className="w-8 h-6 flex justify-center items-center shrink-0">
                                                    {index + 1}
                                                </Badge>
                                                <div className="flex-1">
                                                    <MarkdownRenderer content={question.text} />
                                                </div>
                                            </div>

                                            {question.image_url && (
                                                <div className="pl-10">
                                                    <img
                                                        src={question.image_url}
                                                        alt="Question resource"
                                                        className="max-h-48 rounded-md border"
                                                    />
                                                </div>
                                            )}

                                            <div className="pl-10 space-y-2">
                                                <p className="text-sm font-medium text-muted-foreground">Opciones:</p>
                                                <div className="grid gap-2">
                                                    {options.map((option: any, optIndex: number) => (
                                                        <div
                                                            key={optIndex}
                                                            className={`text-sm p-2 rounded border flex items-center gap-2 ${option.is_correct
                                                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50"
                                                                : "bg-background"
                                                                }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${option.is_correct
                                                                ? "border-green-600 bg-green-600 text-white"
                                                                : "border-muted-foreground"
                                                                }`}>
                                                                {String.fromCharCode(65 + optIndex)}
                                                            </div>
                                                            <span className={option.is_correct ? "font-medium text-green-700 dark:text-green-300" : ""}>
                                                                {option.text}
                                                            </span>
                                                            {option.is_correct && (
                                                                <Badge variant="secondary" className="ml-auto text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-100">
                                                                    Correcta
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {question.explanation && (
                                                <div className="pl-10 mt-2 bg-muted/50 p-3 rounded text-sm">
                                                    <p className="font-semibold mb-1">Explicación:</p>
                                                    <MarkdownRenderer content={question.explanation} />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
