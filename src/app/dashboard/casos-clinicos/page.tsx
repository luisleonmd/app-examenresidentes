import { getCategories } from "@/app/lib/questions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ViewCategoryQuestionsButton } from "../categories/view-category-questions-button"
import { SyncBankDialog } from "../questions/sync-bank-dialog"
import { Database, Lightbulb } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateExamDialog } from "../exams/create-exam-dialog"

export default async function CasosClinicosPage(props: {
    searchParams: Promise<{ category?: string }>
}) {
    const searchParams = await props.searchParams
    const session = await auth()

    // Prevent access for non-coordinators
    if (session?.user.role !== 'COORDINADOR') {
        redirect('/dashboard')
    }

    // Only get categories that have JSON_BANK questions
    const categories = await getCategories('JSON_BANK')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-lg border border-blue-100">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-900">
                        <Database className="size-6 text-blue-600" />
                        Banco de Casos Clínicos (IA)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Rotaciones importadas desde tu generador local. Estas preguntas se mantienen separadas del catálogo general.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <SyncBankDialog />
                </div>
            </div>

            <div className="flex justify-end mb-4">
                <CreateExamDialog source="JSON_BANK" />
            </div>

            <div className="border rounded-md bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rotación / Carpeta</TableHead>
                            <TableHead className="text-center">Casos Clínicos</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <Lightbulb className="size-8 text-amber-500 opacity-50" />
                                        <p>No hay casos clínicos importados aún.</p>
                                        <p className="text-sm">Usa el botón "Sincronizar Banco" para importar tu carpeta local.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : categories.map((cat) => (
                            <TableRow key={cat.id}>
                                <TableCell className="font-medium text-blue-700">
                                    <div className="flex items-center gap-2">
                                        <Database className="size-4 text-blue-400" />
                                        {cat.name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                        {cat._count?.questions || 0}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <ViewCategoryQuestionsButton
                                            categoryId={cat.id}
                                            categoryName={cat.name}
                                            questionCount={cat._count?.questions || 0}
                                            canEdit={true}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
