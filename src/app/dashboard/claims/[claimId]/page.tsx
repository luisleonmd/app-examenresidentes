import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getClaimDetail, updateClaimStatus } from "@/app/lib/claims"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function ClaimDetailPage() {
    const params = useParams()
    const router = useRouter()
    const claimId = params.claimId as string

    const [loading, setLoading] = useState(true)
    const [claim, setClaim] = useState<any>(null)
    const [notes, setNotes] = useState("")
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        getClaimDetail(claimId).then(data => {
            if (data) {
                setClaim(data)
                setNotes(data.resolution_notes || "")
            } else {
                alert("Impugnación no encontrada")
                router.push('/dashboard/claims')
            }
            setLoading(false)
        }).catch(err => {
            alert(err.message)
            router.push('/dashboard/claims')
        })
    }, [claimId, router])

    async function handleResolution(status: 'APPROVED' | 'REJECTED') {
        if (!confirm(`¿Estás seguro de ${status === 'APPROVED' ? 'APROBAR' : 'RECHAZAR'} esta impugnación?`)) return

        setProcessing(true)
        // If approved, maybe we should mark the answer as correct?
        // Specifically, for claims we usually just mark the claim status. 
        // If the claim implies regrading, that logic should be in updateClaimStatus (or manual).
        // For now, updating status is what was requested.
        const result = await updateClaimStatus(claimId, status, notes)
        if (result.success) {
            alert("Estado actualizado correctamente")
            router.push('/dashboard/claims')
        } else {
            alert(result.error)
            setProcessing(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    if (!claim) return <div>Error</div>

    let options = []
    try {
        options = JSON.parse(claim.question.options)
    } catch (e) {
        options = []
    }

    const userSelectedId = claim.answer?.selected_option_id

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/claims')}>
                    <ArrowLeft className="size-4" />
                </Button>
                <h1 className="text-2xl font-bold">Detalle de Impugnación</h1>
                <Badge variant={claim.status === 'PENDING' ? 'outline' : (claim.status === 'APPROVED' ? 'default' : 'destructive')}>
                    {claim.status === 'PENDING' ? 'Pendiente' : (claim.status === 'APPROVED' ? 'Aprobada' : 'Rechazada')}
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Reclamo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                        <div>
                            <span className="font-semibold block text-muted-foreground">Residente</span>
                            <span className="text-lg">{claim.attempt.user.nombre}</span>
                            <span className="block text-xs text-muted-foreground">{claim.attempt.user.cedula}</span>
                        </div>
                        <div>
                            <span className="font-semibold block text-muted-foreground">Examen</span>
                            <span>{claim.attempt.exam.title}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="size-4" />
                                Pregunta Cuestionada
                            </h3>
                            <div className="p-4 border rounded-md bg-card">
                                <p className="mb-4 font-medium">{claim.question.text}</p>

                                <div className="space-y-2">
                                    {options.map((opt: any) => {
                                        const isCorrect = opt.is_correct
                                        const isSelected = opt.id === userSelectedId

                                        return (
                                            <div
                                                key={opt.id}
                                                className={cn(
                                                    "p-3 rounded border text-sm flex justify-between items-center transition-colors",
                                                    isCorrect && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
                                                    isSelected && !isCorrect && "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
                                                    !isCorrect && !isSelected && "bg-gray-50/50"
                                                )}
                                            >
                                                <span>{opt.text}</span>
                                                <div className="flex gap-2">
                                                    {isCorrect && <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Correcta</Badge>}
                                                    {isSelected && <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Selección del Residente</Badge>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {claim.question.explanation && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-semibold text-muted-foreground mb-1">Explicación Oficial:</p>
                                        <p className="text-sm italic">{claim.question.explanation}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Argumento del Residente</h3>
                            <div className="p-4 bg-muted rounded-md border">
                                <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground block mb-1">Justificación Técnica</span>
                                <p className="text-sm mb-4">{claim.justification}</p>

                                {claim.bibliography && (
                                    <>
                                        <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground block mb-1">Bibliografía</span>
                                        <p className="text-sm italic text-muted-foreground">{claim.bibliography}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Resolución</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notas de Resolución (Opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Explique la razón de la decisión..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={claim.status !== 'PENDING'}
                        />
                    </div>

                    {claim.status === 'PENDING' && (
                        <div className="flex gap-4 pt-4">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleResolution('APPROVED')}
                                disabled={processing}
                            >
                                <CheckCircle className="mr-2 size-4" />
                                Aprobar (Aceptar Reclamo)
                            </Button>
                            <Button
                                className="flex-1"
                                variant="destructive"
                                onClick={() => handleResolution('REJECTED')}
                                disabled={processing}
                            >
                                <XCircle className="mr-2 size-4" />
                                Rechazar (Mantener Nota)
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
