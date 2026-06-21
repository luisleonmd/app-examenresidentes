"use client"

import { useState } from "react"
import { HelpCircle } from "lucide-react"
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
import { MarkdownRenderer } from "@/components/markdown-renderer"

interface ExplanationDialogProps {
    questionText: string
    explanation: string
}

export function ExplanationDialog({ questionText, explanation }: ExplanationDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-xs flex gap-1.5 items-center border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                >
                    <HelpCircle className="size-3.5 text-blue-500" />
                    Ver Explicación y Bibliografía
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg text-blue-900 flex items-center gap-2">
                        <HelpCircle className="size-5 text-blue-600" />
                        Justificación Académica
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Fundamento teórico y referencias bibliográficas para la pregunta planteada.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-3 bg-muted rounded text-sm font-medium border text-slate-800">
                        {questionText}
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-sm p-4 border rounded bg-slate-50 dark:bg-slate-900/30">
                        <MarkdownRenderer content={explanation} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Entendido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
