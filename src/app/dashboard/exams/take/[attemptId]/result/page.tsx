"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getExamResult } from "@/app/lib/exam-taking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, CheckCircle, XCircle, Lock, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ClaimDialog } from "./claim-dialog"
import { DownloadReportButton } from "./download-report-button"
import { ExplanationDialog } from "./explanation-dialog"

export default function ExamResultPage() {
    const params = useParams()
    const router = useRouter()
    const attemptId = params.attemptId as string

    const [loading, setLoading] = useState(true)
    const [result, setResult] = useState<any>(null)

    useEffect(() => {
        getExamResult(attemptId).then(data => {
            setResult(data)
            setLoading(false)
        }).catch(err => {
            alert(err.message)
            router.push('/dashboard/exams')
        })
    }, [attemptId, router])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
    if (!result) return <div>Error cargando resultados</div>

    const isPass = result.score >= 70 // Example threshold

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/exams')}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Resultados: {result.examTitle}</h1>
                </div>
                {result.userRole === 'COORDINADOR' && (
                    <DownloadReportButton attemptId={attemptId} />
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Calificación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-4xl font-bold ${isPass ? "text-green-600" : "text-red-600"}`}>
                            {result.score?.toFixed(1) || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isPass ? "Aprobado" : "Reprobado"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge variant={result.status === 'SUBMITTED' ? "default" : "secondary"}>
                            {result.status}
                        </Badge>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Fecha de Envío</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {result.submittedAt ? format(new Date(result.submittedAt), "dd MMM HH:mm", { locale: es }) : "-"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {!result.canReview ? (
                /* Locked review banner */
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900/50 mt-8">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-800 dark:text-amber-300">
                                <Lock className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-base">Revisión de respuestas bloqueada</h3>
                                <p className="text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                                    Por motivos de seguridad académica y transparencia del proceso evaluativo, la revisión detallada de las preguntas, respuestas e historial de fallas estará disponible únicamente cuando finalice el periodo del examen para todos los residentes.
                                </p>
                            </div>
                        </div>
                        {result.endWindow && (
                            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400 bg-amber-100/30 dark:bg-amber-900/20 p-2.5 rounded border border-amber-200/50 dark:border-amber-900/30">
                                <Calendar className="size-3.5" />
                                <span>
                                    <strong>Disponible a partir del:</strong> {format(new Date(result.endWindow), "eeee dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                /* Full detailed review */
                <>
                    <h2 className="text-xl font-bold mt-8">Detalle de Respuestas</h2>
                    <div className="space-y-4">
                        {result.details.map((q: any, idx: number) => (
                            <Card key={q.questionId} className={`border-l-4 ${q.isCorrect ? "border-l-green-500" : "border-l-red-500"}`}>
                                <CardHeader>
                                    <CardTitle className="text-base font-normal flex gap-2">
                                        <span className="font-bold">{idx + 1}.</span>
                                        <div className="flex-1">{q.text}</div>
                                        {q.isCorrect ? (
                                            <CheckCircle className="text-green-500 size-5 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="text-red-500 size-5 flex-shrink-0" />
                                        )}
                                        <div className="ml-auto flex flex-col items-end gap-1">
                                            {q.isClaimed ? (
                                                <>
                                                    <Badge
                                                        variant="outline"
                                                        className={`
                                                            ${q.claimStatus === 'PENDING' ? 'border-yellow-500 text-yellow-600' : ''}
                                                            ${q.claimStatus === 'APPROVED' ? 'border-green-500 text-green-600' : ''}
                                                            ${q.claimStatus === 'REJECTED' ? 'border-red-500 text-red-600' : ''}
                                                        `}
                                                    >
                                                        {q.claimStatus === 'PENDING' && "Reclamo Pendiente"}
                                                        {q.claimStatus === 'APPROVED' && "Reclamo Aprobado"}
                                                        {q.claimStatus === 'REJECTED' && "Reclamo Rechazado"}
                                                    </Badge>
                                                    {q.claimNotes && (
                                                        <div className="text-xs text-muted-foreground max-w-xs text-right bg-muted p-2 rounded">
                                                            <span className="font-bold">Nota:</span> {q.claimNotes}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <ClaimDialog attemptId={attemptId} questionId={q.questionId} questionText={q.text} />
                                            )}
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {q.options.map((opt: any) => {
                                        const isSelected = q.selectedOptionId === opt.id
                                        const isCorrectTarget = opt.is_correct

                                        let bgClass = ""
                                        if (isCorrectTarget) bgClass = "bg-green-100 dark:bg-green-900/30 border-green-200"
                                        else if (isSelected && !isCorrectTarget) bgClass = "bg-red-100 dark:bg-red-900/30 border-red-200"
                                        else bgClass = "bg-muted/30 border-transparent"

                                        return (
                                            <div key={opt.id} className={`p-3 rounded border text-sm flex justify-between ${bgClass}`}>
                                                <span>
                                                    <span className="font-bold mr-2">{opt.id})</span>
                                                    {opt.text}
                                                </span>
                                                {isSelected && <Badge variant="outline" className="ml-2">Tu respuesta</Badge>}
                                                {isCorrectTarget && !isSelected && <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-700">Correcta</Badge>}
                                            </div>
                                        )
                                    })}

                                    {q.explanation && !q.isCorrect && (
                                        <ExplanationDialog questionText={q.text} explanation={q.explanation} />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

