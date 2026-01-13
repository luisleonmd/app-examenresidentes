import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardStats, getPerformanceData, getRecentActivity } from "@/app/lib/dashboard-stats"
import { StatsCard } from "@/components/dashboard/stats-card"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { BookOpen, Users, FileQuestion, TrendingUp, Calendar, Award } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const [statsResult, performanceResult, activityResult] = await Promise.all([
        getDashboardStats(),
        getPerformanceData(),
        getRecentActivity()
    ])

    const stats = statsResult.success ? statsResult.stats : null
    const performanceData = performanceResult.success ? performanceResult.data : []
    const activities = activityResult.success ? activityResult.activities : []

    const role = session.user.role

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Bienvenido, {session.user.nombre}</p>
            </div>

            {/* Statistics Cards */}
            {role === 'COORDINADOR' && stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Exámenes"
                        value={stats.totalExams}
                        icon={BookOpen}
                        description="Exámenes creados"
                    />
                    <StatsCard
                        title="Total Estudiantes"
                        value={stats.totalStudents}
                        icon={Users}
                        description="Residentes activos"
                    />
                    <StatsCard
                        title="Banco de Preguntas"
                        value={stats.totalQuestions}
                        icon={FileQuestion}
                        description="Preguntas publicadas"
                    />
                    <StatsCard
                        title="Promedio General"
                        value={`${stats.avgScore}%`}
                        icon={TrendingUp}
                        description={`${stats.totalAttempts} exámenes completados`}
                    />
                </div>
            )}

            {role === 'PROFESOR' && stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <StatsCard
                        title="Mis Exámenes"
                        value={stats.totalExams}
                        icon={BookOpen}
                        description="Exámenes creados"
                    />
                    <StatsCard
                        title="Intentos Completados"
                        value={stats.totalAttempts}
                        icon={Users}
                        description="Por estudiantes"
                    />
                    <StatsCard
                        title="Promedio"
                        value={`${stats.avgScore}%`}
                        icon={TrendingUp}
                        description="Calificación promedio"
                    />
                </div>
            )}

            {role === 'RESIDENTE' && stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <StatsCard
                        title="Exámenes Realizados"
                        value={stats.totalAttempts}
                        icon={BookOpen}
                        description="Completados"
                    />
                    <StatsCard
                        title="Mi Promedio"
                        value={`${stats.avgScore}%`}
                        icon={Award}
                        description="Calificación promedio"
                    />
                    <StatsCard
                        title="Próximos Exámenes"
                        value={stats.upcomingExams}
                        icon={Calendar}
                        description="Disponibles ahora"
                    />
                </div>
            )}

            {/* Performance Chart */}
            <div className="grid gap-4 md:grid-cols-2">
                <PerformanceChart
                    data={performanceData}
                    title={role === 'RESIDENTE' ? "Mi Rendimiento" : "Rendimiento General"}
                    description={role === 'RESIDENTE' ? "Evolución de mis calificaciones" : "Evolución de calificaciones"}
                />

                {/* Activity Feed */}
                <ActivityFeed activities={activities} />
            </div>
        </div>
    )
}
