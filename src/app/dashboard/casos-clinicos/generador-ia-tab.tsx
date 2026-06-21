"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Key, Info, HelpCircle } from "lucide-react"
import { generateQuestionsWithAI } from "@/app/lib/ai-generator"

interface Category {
    id: string
    name: string
    bibliography: string | null
}

interface GeneradorIaTabProps {
    categories: Category[]
}

export function GeneradorIaTab({ categories }: GeneradorIaTabProps) {
    const [apiKey, setApiKey] = useState("")
    const [selectedCatId, setSelectedCatId] = useState("")
    const [questionCount, setQuestionCount] = useState("3")
    const [difficulty, setDifficulty] = useState<"ALTA" | "MEDIA">("ALTA")
    const [modelName, setModelName] = useState("gemini-1.5-flash")
    const [generating, setGenerating] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const router = useRouter()

    // Load API Key from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem("gemini_api_key")
        if (savedKey) {
            setApiKey(savedKey)
        }
    }, [])

    const handleSaveKey = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setApiKey(val)
        localStorage.setItem("gemini_api_key", val)
    }

    const handleGenerate = async () => {
        if (!selectedCatId) {
            setErrorMsg("Seleccione una rotación o curso primero.")
            return
        }

        if (!apiKey) {
            setErrorMsg("Ingrese su clave de API de Gemini.")
            return
        }

        setErrorMsg(null)
        setSuccessMsg(null)
        setGenerating(true)

        try {
            const count = parseInt(questionCount, 10)
            const result = await generateQuestionsWithAI(
                selectedCatId,
                apiKey,
                count,
                difficulty,
                modelName
            )

            if (result.success) {
                setSuccessMsg(result.message || "Preguntas generadas correctamente.")
                router.refresh()
            } else {
                setErrorMsg(result.error || "Ocurrió un error al generar las preguntas.")
            }
        } catch (e: any) {
            setErrorMsg("Error del sistema: " + e.message)
        } finally {
            setGenerating(false)
        }
    }

    const selectedCategory = categories.find(c => c.id === selectedCatId)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="border shadow-sm">
                    <CardHeader className="bg-blue-50/30 border-b">
                        <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                            <Sparkles className="size-5 text-blue-600 animate-pulse" />
                            Generar Casos Clínicos con Inteligencia Artificial
                        </CardTitle>
                        <CardDescription>
                            Configure los parámetros del examen MIR y la IA generará casos clínicos fundamentados en tu bibliografía oficial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        {/* API Key */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="apiKey" className="flex items-center gap-2 text-foreground font-medium">
                                    <Key className="size-4 text-slate-400" />
                                    Clave de API de Gemini (API Key)
                                </Label>
                                <a 
                                    href="https://aistudio.google.com/" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    Obtener gratis aquí
                                </a>
                            </div>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="Pega tu API Key de Gemini..."
                                value={apiKey}
                                onChange={handleSaveKey}
                                className="font-mono"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Se almacena localmente en su navegador para facilitar el acceso en futuros usos.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Category Select */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Rotación / Curso Destino</Label>
                                <Select onValueChange={setSelectedCatId} value={selectedCatId}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Seleccione Rotación/Curso" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Quantity Select */}
                            <div className="space-y-2">
                                <Label htmlFor="count">Cantidad de Preguntas a Generar</Label>
                                <Select onValueChange={setQuestionCount} value={questionCount}>
                                    <SelectTrigger id="count">
                                        <SelectValue placeholder="3 preguntas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 pregunta</SelectItem>
                                        <SelectItem value="2">2 preguntas</SelectItem>
                                        <SelectItem value="3">3 preguntas</SelectItem>
                                        <SelectItem value="4">4 preguntas</SelectItem>
                                        <SelectItem value="5">5 preguntas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Complexity Select */}
                            <div className="space-y-2">
                                <Label htmlFor="difficulty">Complejidad Requerida</Label>
                                <Select 
                                    onValueChange={(val) => setDifficulty(val as "ALTA" | "MEDIA")} 
                                    value={difficulty}
                                >
                                    <SelectTrigger id="difficulty">
                                        <SelectValue placeholder="Seleccione Complejidad" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALTA">Alta Complejidad (Rigurosa / Analítica)</SelectItem>
                                        <SelectItem value="MEDIA">Moderada Complejidad (Directa)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* AI Model */}
                            <div className="space-y-2">
                                <Label htmlFor="model">Modelo de Inteligencia Artificial</Label>
                                <Select onValueChange={setModelName} value={modelName}>
                                    <SelectTrigger id="model">
                                        <SelectValue placeholder="Gemini 1.5 Flash" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido y Óptimo)</SelectItem>
                                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Máximo Razonamiento)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Error and Success States */}
                        {errorMsg && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                                <strong>Error: </strong> {errorMsg}
                            </div>
                        )}

                        {successMsg && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                                <strong>Éxito: </strong> {successMsg}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 border-t pt-4 flex justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="size-3.5" />
                            Se inyectará la bibliografía cargada en el prompt.
                        </span>
                        <Button
                            onClick={handleGenerate}
                            disabled={generating || !selectedCatId}
                            className="bg-blue-600 hover:bg-blue-700 min-w-[150px] gap-2"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Generando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-4" />
                                    Iniciar Generación
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Instruction Column */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/50 border-b">
                        <CardTitle className="flex items-center gap-2 text-md text-foreground">
                            <HelpCircle className="size-4.5 text-blue-600" />
                            ¿Cómo funciona?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground leading-relaxed">
                        <p>
                            1. <strong>Configura la bibliografía:</strong> Asegúrate de haber completado la bibliografía de la rotación en la pestaña "Bibliografía". Si está vacía, se utilizarán referencias generales.
                        </p>
                        <p>
                            2. <strong>Obtén tu API Key:</strong> Haz clic en <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">Google AI Studio</a>, inicia sesión con tu cuenta de Google y haz clic en "Get API Key" para crear una clave gratuita.
                        </p>
                        <p>
                            3. <strong>Ejecuta y valora:</strong> Tras presionar "Iniciar Generación", la IA generará preguntas siguiendo el formato MIR (Caso Clínico + 4 Opciones + Justificación detallada + Referencia bibliográfica exacta).
                        </p>
                        <div className="border-t pt-3 mt-3">
                            <p className="text-xs font-semibold text-foreground mb-1">
                                Parámetro de Dificultad MIR:
                            </p>
                            <p className="text-xs">
                                Para cumplir con el requerimiento del programa, la IA estructurará las preguntas usando un razonamiento complejo de nivel residente superior.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {selectedCategory && (
                    <Card className="border shadow-sm bg-slate-50/50">
                        <CardHeader className="py-3 border-b">
                            <CardTitle className="text-sm font-semibold">Bibliografía Inyectada</CardTitle>
                        </CardHeader>
                        <CardContent className="py-3 text-xs">
                            {selectedCategory.bibliography ? (
                                <pre className="whitespace-pre-wrap font-mono text-[11px] bg-white p-2 border rounded max-h-[150px] overflow-y-auto">
                                    {selectedCategory.bibliography}
                                </pre>
                            ) : (
                                <span className="text-amber-600">
                                    Sin bibliografía configurada. Se utilizará bibliografía genérica de Medicina Familiar.
                                </span>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
