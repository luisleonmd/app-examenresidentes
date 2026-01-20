"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getExamData, submitExamAnswer, finishExam } from "@/app/lib/exam-taking"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, Clock } from "lucide-react"

export default function ExamRunnerPage() {
    const params = useParams()
    const router = useRouter()
    const attemptId = params.attemptId as string

    const [loading, setLoading] = useState(true)
    const [examData, setExamData] = useState<any>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({}) // questionId -> optionId
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        getExamData(attemptId).then(data => {
            if (data.status === 'SUBMITTED') {
                alert("Examen ya finalizado")
                router.push('/dashboard/exams')
                return
            }

            setExamData(data)

            // Calculate time left
            const end = new Date(data.endTime).getTime()
            const now = new Date().getTime()
            setTimeLeft(Math.floor((end - now) / 1000))

            // Hydrate answers if we had them (not implemented in getExamData yet but good practice)

            setLoading(false)
        }).catch(err => {
            alert(err.message)
            router.push('/dashboard')
        })
    }, [attemptId, router])

    // Timer
    useEffect(() => {
        if (!timeLeft || timeLeft <= 0) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    handleFinish()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [timeLeft])

    // Format time
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    async function handleOptionSelect(optionId: string) {
        if (!examData) return
        const currentQ = examData.questions[currentQuestionIndex]

        // Optimistic update
        setAnswers(prev => ({ ...prev, [currentQ.question_id]: optionId }))

        // Server update (in background)
        // Find answer ID for this question
        const answerId = currentQ.id // In getExamData we mapped answer.id
        await submitExamAnswer(answerId, optionId)
    }

    async function handleFinish() {
        if (isSubmitting) return
        setIsSubmitting(true)
        const result = await finishExam(attemptId)
        if (result.success) {
            router.push(`/dashboard/exams/take/${attemptId}/result`) // Redirect to results
        } else {
            alert("Error al finalizar")
            setIsSubmitting(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    if (!examData) return <div>Error cargando examen</div>

    const currentQ = examData.questions[currentQuestionIndex]
    const isLast = currentQuestionIndex === examData.questions.length - 1

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                <div>
                    <h2 className="text-xl font-bold">{examData.examTitle}</h2>
                    <p className="text-sm text-muted-foreground">Pregunta {currentQuestionIndex + 1} de {examData.questions.length}</p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xl font-bold text-primary">
                    <Clock className="size-5" />
                    {formatTime(timeLeft)}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="mb-2">
                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {currentQ.categoryName}
                        </span>
                    </div>
                    <CardTitle className="leading-relaxed space-y-4">
                        {currentQ.image_url && (
                            <div className="relative w-full max-w-2xl mx-auto mb-4 rounded-lg overflow-hidden border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={currentQ.image_url}
                                    alt="Imagen de la pregunta"
                                    className="w-full h-auto object-contain max-h-[400px]"
                                />
                            </div>
                        )}
                        <div>{currentQ.question_text}</div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={answers[currentQ.question_id] || currentQ.selected_option_id || ""}
                        onValueChange={handleOptionSelect}
                        className="space-y-4"
                    >
                        {currentQ.options.map((opt: any) => (
                            <div key={opt.id} className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-accent cursor-pointer">
                                <RadioGroupItem value={opt.id} id={opt.id} />
                                <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-normal text-base">
                                    <span className="font-bold mr-2">{opt.id})</span> {opt.text}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
                <CardFooter className="justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                    >
                        Anterior
                    </Button>

                    {isLast ? (
                        <Button onClick={handleFinish} disabled={isSubmitting} variant="destructive">
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2 size-4" />}
                            Finalizar Examen
                        </Button>
                    ) : (
                        <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(examData.questions.length - 1, prev + 1))}>
                            Siguiente
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <div className="flex flex-wrap gap-2 justify-center">
                {examData.questions.map((q: any, idx: number) => (
                    <button
                        key={q.question_id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-8 h-8 rounded text-xs font-bold transition-colors ${idx === currentQuestionIndex
                            ? 'bg-primary text-primary-foreground'
                            : (answers[q.question_id] || q.selected_option_id)
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                    >
                        {idx + 1}
                    </button>
                ))}
            </div>
        </div>
    )
}
