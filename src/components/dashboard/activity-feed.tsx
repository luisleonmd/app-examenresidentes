import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, FileText } from "lucide-react"

interface Activity {
    type: string
    description: string
    timestamp: Date
    score?: number
    status?: string
}

interface ActivityFeedProps {
    activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'exam_completed':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />
            case 'claim_submitted':
                return <AlertCircle className="h-4 w-4 text-yellow-600" />
            default:
                return <FileText className="h-4 w-4 text-blue-600" />
        }
    }

    const getStatusBadge = (status?: string) => {
        if (!status) return null

        const variants: Record<string, any> = {
            'PENDING': { variant: 'secondary', label: 'Pendiente' },
            'APPROVED': { variant: 'default', label: 'Aprobado' },
            'REJECTED': { variant: 'destructive', label: 'Rechazado' }
        }

        const config = variants[status] || { variant: 'secondary', label: status }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const formatTimestamp = (timestamp: Date) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) return `Hace ${diffMins} min`
        if (diffHours < 24) return `Hace ${diffHours}h`
        if (diffDays < 7) return `Hace ${diffDays}d`
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="mt-0.5">{getIcon(activity.type)}</div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm">{activity.description}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {formatTimestamp(activity.timestamp)}
                                        </span>
                                        {activity.score !== undefined && (
                                            <Badge variant="outline">{activity.score}%</Badge>
                                        )}
                                        {getStatusBadge(activity.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
