"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getExamResultsForProfessor } from "@/app/lib/exam-taking"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { DownloadCourseReportButton } from "./download-course-report-button"
import { ExportExamResultsButton } from "./export-exam-results-button"
import { ConsolidatedReportButton } from "./consolidated-report-button"

export default function ExamResultsProfessorPage() {
    const params = useParams()
    const router = useRouter()
    const examId = params.examId as string

    const [loading, setLoading] = useState(true)
    const [attempts, setAttempts] = useState<any[]>([])

    useEffect(() => {
        getExamResultsForProfessor(examId).then(data => {
            setAttempts(data)
            setLoading(false)
        }).catch(err => {
            alert(err.message)
            router.push('/dashboard/exams')
        })
    }, [examId, router])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/exams')}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Resultados del Examen</h1>
                </div>
                <div className="flex gap-2">
                    <ConsolidatedReportButton examId={examId} />
                    <ExportExamResultsButton examId={examId} />
                    <DownloadCourseReportButton examId={examId} />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Residente</TableHead>
                            <TableHead>Cédula</TableHead>
                            <TableHead>Cohorte</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Calificación</TableHead>
                            <TableHead>Fecha Envío</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attempts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No hay intentos registrados aún.
                                </TableCell>
                            </TableRow>
                        ) : attempts.map((attempt) => (
                            <TableRow key={attempt.attemptId}>
                                <TableCell className="font-medium">{attempt.studentName}</TableCell>
                                <TableCell>{attempt.studentId}</TableCell>
                                <TableCell>{attempt.cohort}</TableCell>
                                <TableCell>{attempt.status}</TableCell>
                                <TableCell className="font-bold">
                                    {attempt.score !== null ? `${attempt.score.toFixed(1)}%` : "-"}
                                </TableCell>
                                <TableCell>
                                    {attempt.endTime ? format(new Date(attempt.endTime), "dd MMM HH:mm", { locale: es }) : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => router.push(`/dashboard/exams/take/${attempt.attemptId}/result`)}
                                    >
                                        <Eye className="size-3 mr-2" />
                                        Ver
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
