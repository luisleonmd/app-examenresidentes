"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getClaims, updateClaimStatus } from "@/app/lib/claims" // We will reuse getClaims or add getClaim
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// We'll just fetch all claims and find the one (inefficient but fast for MVP)
// Or better, add getClaim to server actions. Let's assume we add it or just filter locally if `getClaims` returns all.
// `getClaims` is filtering by status optionally, if we call without args it returns all.

export default function ClaimDetailPage() {
    const params = useParams()
    const router = useRouter()
    const claimId = params.claimId as string

    const [loading, setLoading] = useState(true)
    const [claim, setClaim] = useState<any>(null)
    const [notes, setNotes] = useState("")
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        // MVP: Fetch list and filter. Better: Implement getClaimById later.
        getClaims().then(data => {
            const found = data.find((c: any) => c.id === claimId)
            if (found) {
                setClaim(found)
                setNotes(found.resolution_notes || "")
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

    return (
        <div className="max-w-3xl mx-auto space-y-6">
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
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold block">Residente:</span>
                            {claim.attempt.user.nombre} ({claim.attempt.user.cedula})
                        </div>
                        <div>
                            <span className="font-semibold block">Examen:</span>
                            {claim.attempt.exam.title}
                        </div>
                    </div>

                    <div className="p-4 bg-muted rounded-md">
                        <span className="font-semibold block mb-2 text-sm">Pregunta Cuestionada:</span>
                        <p>{claim.question.text}</p>
                    </div>

                    <div>
                        <span className="font-semibold block mb-1">Justificación Técnica:</span>
                        <p className="text-sm p-3 border rounded-md">{claim.justification}</p>
                    </div>

                    <div>
                        <span className="font-semibold block mb-1">Bibliografía:</span>
                        <p className="text-sm p-3 border rounded-md italic">{claim.bibliography}</p>
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
                                Aprobar
                            </Button>
                            <Button
                                className="flex-1"
                                variant="destructive"
                                onClick={() => handleResolution('REJECTED')}
                                disabled={processing}
                            >
                                <XCircle className="mr-2 size-4" />
                                Rechazar
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
