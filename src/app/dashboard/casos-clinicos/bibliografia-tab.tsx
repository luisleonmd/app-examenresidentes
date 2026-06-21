"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Save, Loader2, Check } from "lucide-react"
import { updateCategoryBibliography } from "@/app/lib/categories"

interface Category {
    id: string
    name: string
    description: string | null
    bibliography: string | null
}

interface BibliografiaTabProps {
    categories: Category[]
}

export function BibliografiaTab({ categories }: BibliografiaTabProps) {
    const [selectedCatId, setSelectedCatId] = useState<string | null>(
        categories.length > 0 ? categories[0].id : null
    )
    const [biblioText, setBiblioText] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [savedSuccess, setSavedSuccess] = useState(false)
    const router = useRouter()

    const selectedCategory = categories.find(c => c.id === selectedCatId)

    // Sync input text when category selection changes
    useState(() => {
        if (categories.length > 0) {
            setBiblioText(categories[0].bibliography || "")
        }
    })

    const handleSelectCategory = (id: string) => {
        setSelectedCatId(id)
        const cat = categories.find(c => c.id === id)
        setBiblioText(cat?.bibliography || "")
        setSavedSuccess(false)
    }

    const handleSave = async () => {
        if (!selectedCatId) return

        setSaving(true)
        setSavedSuccess(false)
        try {
            const result = await updateCategoryBibliography(selectedCatId, biblioText)
            if (result.success) {
                setSavedSuccess(true)
                // Update local list state
                const cat = categories.find(c => c.id === selectedCatId)
                if (cat) cat.bibliography = biblioText
                router.refresh()
                // Hide success message after 3 seconds
                setTimeout(() => setSavedSuccess(false), 3000)
            } else {
                alert(result.error || "Ocurrió un error al guardar la bibliografía.")
            }
        } catch (e: any) {
            alert("Error: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar list of Rotations / Courses */}
            <div className="md:col-span-1 border rounded-lg overflow-hidden bg-card max-h-[600px] flex flex-col">
                <div className="p-4 bg-muted border-b">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                        Rotaciones y Cursos
                    </h3>
                </div>
                <div className="overflow-y-auto flex-1 divide-y">
                    {categories.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No hay rotaciones disponibles. Sincroniza el banco primero.
                        </div>
                    ) : (
                        categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleSelectCategory(cat.id)}
                                className={`w-full text-left p-4 transition-colors text-sm ${
                                    selectedCatId === cat.id
                                        ? "bg-blue-50/70 border-l-4 border-blue-600 font-semibold text-blue-700"
                                        : "hover:bg-slate-50 text-foreground"
                                }`}
                            >
                                <div className="flex items-start gap-2">
                                    <BookOpen className={`size-4 mt-0.5 shrink-0 ${
                                        selectedCatId === cat.id ? "text-blue-600" : "text-slate-400"
                                    }`} />
                                    <div className="truncate">
                                        <p className="truncate">{cat.name}</p>
                                        {cat.bibliography ? (
                                            <span className="text-[10px] text-green-600 font-normal bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                                                Con Bibliografía
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-amber-600 font-normal bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                Sin Bibliografía
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Editing Panel */}
            <div className="md:col-span-2">
                {selectedCategory ? (
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                                <BookOpen className="size-5 text-blue-600" />
                                Bibliografía Oficial: {selectedCategory.name}
                            </CardTitle>
                            <CardDescription>
                                Esta bibliografía se inyectará en la Inteligencia Artificial al generar preguntas y se mostrará como la referencia de respaldo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground block">
                                    Referencias bibliográficas (un libro o artículo por línea)
                                </label>
                                <Textarea
                                    value={biblioText}
                                    onChange={(e) => setBiblioText(e.target.value)}
                                    placeholder="Ejemplo:&#10;Longo DL, Fauci AS, et al. Harrison Principios de Medicina Interna. 21ª ed. McGraw-Hill.&#10;Normativa nacional de diagnóstico VIH 2026."
                                    className="min-h-[250px] font-mono text-sm leading-relaxed"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-muted-foreground">
                                    Nota: El generador MIR usará exactamente este texto de referencia.
                                </span>
                                <div className="flex items-center gap-3">
                                    {savedSuccess && (
                                        <span className="flex items-center gap-1 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 animate-fade-in">
                                            <Check className="size-4" />
                                            Guardado
                                        </span>
                                    )}
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 size-4" />
                                                Guardar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                            <BookOpen className="size-12 text-slate-300" />
                            <p>Selecciona una rotación o curso para configurar su bibliografía.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
