"use client"

import { Button } from "@/components/ui/button"
import { Play, Info, AlertTriangle } from "lucide-react"
import { startExam } from "@/app/lib/exam-taking"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"

interface StartExamDialogProps {
    examId: string
    attempt?: { id: string, status: string } | null
    startWindow: Date
    endWindow: Date
    claimsEnd: Date | null
}

export function StartExamDialog({ examId, attempt, startWindow, endWindow, claimsEnd }: StartExamDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [agreed, setAgreed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleStart() {
        if (attempt?.id) {
            router.push(`/dashboard/exams/take/${attempt.id}`)
            return
        }

        setIsLoading(true)
        const result = await startExam(examId)
        if (result.success && result.attemptId) {
            router.push(`/dashboard/exams/take/${result.attemptId}`)
        } else {
            alert(result.error)
            setIsLoading(false)
        }
    }

    if (attempt?.status === 'SUBMITTED') {
        return (
            <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/exams/take/${attempt.id}/result`)} className="gap-2">
                Ver Resultados
            </Button>
        )
    }

    const isResume = attempt?.status === 'IN_PROGRESS'

    if (isResume) {
        return (
            <Button size="sm" onClick={handleStart} className="gap-2" variant="secondary">
                <Play className="size-3" />
                Continuar
            </Button>
        )
    }

    const formatTime = (date: Date) => date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })
    const formatDate = (date: Date) => date.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const claimsEndDate = claimsEnd ? formatDate(new Date(claimsEnd)) : "No definido"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Play className="size-3" />
                    Iniciar
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Info className="h-6 w-6 text-blue-600" />
                        Indicaciones Generales antes del Examen
                    </DialogTitle>
                    <DialogDescription>
                        Por favor lea detenidamente las siguientes instrucciones antes de comenzar la prueba.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 text-sm md:text-base">
                    <Card className="p-4 bg-yellow-50 border-yellow-200 text-yellow-900">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <p className="font-medium">
                                Esta evaluación está programada para iniciar a las <strong>{formatTime(new Date(startWindow))}</strong> y finalizará a las <strong>{formatTime(new Date(endWindow))}</strong>.
                            </p>
                        </div>
                    </Card>

                    <ol className="list-decimal list-inside space-y-3 marker:font-bold marker:text-gray-700">
                        <li className="pl-1">
                            La siguiente evaluación constará de preguntas de <strong>selección única (marque con equis)</strong>.
                        </li>
                        <li className="pl-1">
                            <strong>No se permitirán dudas sobre el fondo de la pregunta</strong>; solamente se aceptarán dudas de la forma de las mismas.
                        </li>
                        <li className="pl-1">
                            Para evacuar dudas, deben de <strong>levantar la mano</strong> y se irán atendiendo las mismas en orden de solicitud.
                        </li>
                        <li className="pl-1">
                            Una vez finalizado el tiempo descrito anteriormente podrá ver su nota e iniciará el periodo de entrega de reclamos.
                        </li>
                        <li className="pl-1 text-red-700 font-medium">
                            El último día de entrega de reclamos será el <strong>{claimsEndDate}</strong> al medio día. Después de esta fecha no se recibirán bajo ninguna circunstancia.
                        </li>
                        <li className="pl-1">
                            Los reclamos deben de enviarse en la <strong>plataforma de mediación virtual</strong> en la semana seleccionada para esto.
                        </li>
                    </ol>
                </div>

                <DialogFooter className="flex-col sm:justify-between sm:flex-row gap-4 items-center border-t pt-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="terms"
                            checked={agreed}
                            onCheckedChange={(c) => setAgreed(c as boolean)}
                        />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            He leído y comprendido las indicaciones.
                        </label>
                    </div>
                    <Button onClick={handleStart} disabled={!agreed || isLoading}>
                        {isLoading ? "Iniciando..." : "Comenzar Examen"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
