import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardStats, getPerformanceData, getRecentActivity } from "@/app/lib/dashboard-stats"
import { StatsCard } from "@/components/dashboard/stats-card"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { BookOpen, Users, FileQuestion, TrendingUp, Calendar, Award } from "lucide-react"

export const dynamic = 'force-dynamic'

import { getResources } from "@/app/lib/resources"
import { ResourcesSection } from "@/components/dashboard/resources-section"

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const [statsResult, performanceResult, activityResult, resources] = await Promise.all([
        getDashboardStats(),
        getPerformanceData(),
        getRecentActivity(),
        getResources()
    ])

    const stats = statsResult.success ? statsResult.stats : null
    const performanceData = performanceResult.success ? performanceResult.data : []
    const activities = activityResult.success ? activityResult.activities : []

    const role = session.user.role

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 border-b pb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                    Entorno para Evaluación de Residentes de Medicina Familiar y Comunitaria
                </h1>
                <h2 className="text-xl text-muted-foreground font-medium">
                    Universidad de Costa Rica
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4" />
                    <span className="capitalize">
                        {new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>
                <p className="mt-4 text-base text-gray-600 dark:text-gray-300 max-w-4xl">
                    Bienvenido, {session.user.nombre}. Esta plataforma tiene como objetivo principal la evaluación de los conocimientos adquiridos en las rotaciones y cursos del periodo evaluado. Utilice este entorno para gestionar y realizar evaluaciones, acceder a recursos de apoyo y consultar su rendimiento académico.
                </p>
            </div>

            {/* Statistics Cards */}
            {role === 'COORDINADOR' && stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Exámenes"
                        value={stats.totalExams ?? 0}
                        icon={BookOpen}
                        description="Exámenes creados"
                    />
                    <StatsCard
                        title="Total Estudiantes"
                        value={stats.totalStudents ?? 0}
                        icon={Users}
                        description="Residentes activos"
                    />
                    <StatsCard
                        title="Banco de Preguntas"
                        value={stats.totalQuestions ?? 0}
                        icon={FileQuestion}
                        description="Preguntas publicadas"
                    />
                    <StatsCard
                        title="Promedio General"
                        value={`${stats.avgScore ?? 0}%`}
                        icon={TrendingUp}
                        description={`${stats.totalAttempts ?? 0} exámenes completados`}
                    />
                </div>
            )}

            {role === 'PROFESOR' && stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <StatsCard
                        title="Mis Exámenes"
                        value={stats.totalExams ?? 0}
                        icon={BookOpen}
                        description="Exámenes creados"
                    />
                    <StatsCard
                        title="Intentos Completados"
                        value={stats.totalAttempts ?? 0}
                        icon={Users}
                        description="Por estudiantes"
                    />
                    <StatsCard
                        title="Promedio"
                        value={`${stats.avgScore ?? 0}%`}
                        icon={TrendingUp}
                        description="Calificación promedio"
                    />
                </div>
            )}

            {role === 'RESIDENTE' && stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <StatsCard
                        title="Exámenes Realizados"
                        value={stats.totalAttempts ?? 0}
                        icon={BookOpen}
                        description="Completados"
                    />
                    <StatsCard
                        title="Mi Promedio"
                        value={`${stats.avgScore ?? 0}%`}
                        icon={Award}
                        description="Calificación promedio"
                    />
                    <StatsCard
                        title="Próximos Exámenes"
                        value={stats.upcomingExams ?? 0}
                        icon={Calendar}
                        description="Disponibles ahora"
                    />
                </div>
            )}

            <ResourcesSection resources={resources} userRole={role} />

            {/* Performance Chart */}
            <div className="grid gap-4 md:grid-cols-2">
                <PerformanceChart
                    data={performanceData || []}
                    title={role === 'RESIDENTE' ? "Mi Rendimiento" : "Rendimiento General"}
                    description={role === 'RESIDENTE' ? "Evolución de mis calificaciones" : "Evolución de calificaciones"}
                />

                {/* Activity Feed */}
                <ActivityFeed activities={activities || []} />
            </div>
        </div>
    )
}
