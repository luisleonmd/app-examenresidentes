"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, BookOpen, Users, FolderOpen } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { globalSearch } from "@/app/lib/search"
import { Badge } from "@/components/ui/badge"

interface SearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults({})
            return
        }

        setLoading(true)
        const timer = setTimeout(async () => {
            const response = await globalSearch(query)
            if (response.success) {
                setResults(response.results)
            }
            setLoading(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const handleSelect = useCallback((type: string, id: string) => {
        onOpenChange(false)
        setQuery("")
        setResults({})

        switch (type) {
            case 'exam':
                router.push(`/dashboard/exams`)
                break
            case 'question':
                router.push(`/dashboard/questions`)
                break
            case 'student':
                router.push(`/dashboard/exams`)
                break
            case 'category':
                router.push(`/dashboard/questions?category=${id}`)
                break
        }
    }, [router, onOpenChange])

    const hasResults = results.exams?.length > 0 ||
        results.questions?.length > 0 ||
        results.students?.length > 0 ||
        results.categories?.length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Búsqueda Global</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar exámenes, preguntas, estudiantes..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10"
                            autoFocus
                        />
                    </div>

                    {loading && (
                        <p className="text-sm text-muted-foreground">Buscando...</p>
                    )}

                    {!loading && query.length >= 2 && !hasResults && (
                        <p className="text-sm text-muted-foreground">No se encontraron resultados</p>
                    )}

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {/* Exams */}
                        {results.exams?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Exámenes
                                </h3>
                                <div className="space-y-1">
                                    {results.exams.map((exam: any) => (
                                        <button
                                            key={exam.id}
                                            onClick={() => handleSelect('exam', exam.id)}
                                            className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                                        >
                                            <p className="text-sm font-medium">{exam.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(exam.start_window).toLocaleDateString('es-ES')}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Questions */}
                        {results.questions?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Preguntas
                                </h3>
                                <div className="space-y-1">
                                    {results.questions.map((question: any) => (
                                        <button
                                            key={question.id}
                                            onClick={() => handleSelect('question', question.id)}
                                            className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                                        >
                                            <p className="text-sm line-clamp-2">{question.text}</p>
                                            <Badge variant="outline" className="mt-1">
                                                {question.category.name}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Students */}
                        {results.students?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Estudiantes
                                </h3>
                                <div className="space-y-1">
                                    {results.students.map((student: any) => (
                                        <button
                                            key={student.id}
                                            onClick={() => handleSelect('student', student.id)}
                                            className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                                        >
                                            <p className="text-sm font-medium">{student.nombre}</p>
                                            <p className="text-xs text-muted-foreground">{student.cedula}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Categories */}
                        {results.categories?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4" />
                                    Categorías
                                </h3>
                                <div className="space-y-1">
                                    {results.categories.map((category: any) => (
                                        <button
                                            key={category.id}
                                            onClick={() => handleSelect('category', category.id)}
                                            className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                                        >
                                            <p className="text-sm font-medium">{category.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {category.questionCount} preguntas
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Presiona <kbd className="px-1.5 py-0.5 text-xs border rounded">Esc</kbd> para cerrar
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
