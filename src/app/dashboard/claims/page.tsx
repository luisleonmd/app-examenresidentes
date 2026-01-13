"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getClaims } from "@/app/lib/claims"
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
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function ClaimsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [claims, setClaims] = useState<any[]>([])

    useEffect(() => {
        getClaims().then(data => {
            setClaims(data)
            setLoading(false)
        }).catch(err => {
            alert(err.message)
            setLoading(false)
        })
    }, [])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Impugnaciones</h1>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Examen</TableHead>
                            <TableHead>Residente</TableHead>
                            <TableHead>Pregunta</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {claims.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay impugnaciones registradas.
                                </TableCell>
                            </TableRow>
                        ) : claims.map((claim) => (
                            <TableRow key={claim.id}>
                                <TableCell className="whitespace-nowrap">
                                    {format(new Date(claim.created_at), "dd MMM HH:mm", { locale: es })}
                                </TableCell>
                                <TableCell>{claim.attempt.exam.title}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{claim.attempt.user.nombre}</div>
                                    <div className="text-xs text-muted-foreground">{claim.attempt.user.cedula}</div>
                                </TableCell>
                                <TableCell className="max-w-xs truncate" title={claim.question.text}>
                                    {claim.question.text}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={claim.status === 'PENDING' ? 'outline' : (claim.status === 'APPROVED' ? 'default' : 'destructive')}>
                                        {claim.status === 'PENDING' ? 'Pendiente' : (claim.status === 'APPROVED' ? 'Aprobada' : 'Rechazada')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => router.push(`/dashboard/claims/${claim.id}`)}
                                    >
                                        <Eye className="size-4 mr-2" />
                                        Revisar
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
