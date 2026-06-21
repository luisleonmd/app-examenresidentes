import { getCategories } from "@/app/lib/questions"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
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
import { Database, Lightbulb, BookOpen, Sparkles, FolderOpen } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateExamDialog } from "../exams/create-exam-dialog"
import { BibliografiaTab } from "./bibliografia-tab"
import { GeneradorIaTab } from "./generador-ia-tab"
import { DeleteAllQuestionsButton } from "./delete-all-button"

const prisma = new PrismaClient()

export default async function CasosClinicosPage(props: {
    searchParams: Promise<{ category?: string }>
}) {
    const searchParams = await props.searchParams
    const session = await auth()

    // Prevent access for non-coordinators
    if (session?.user.role !== 'COORDINADOR') {
        redirect('/dashboard')
    }

    // Only get categories that have JSON_BANK questions for folder view
    const categories = await getCategories('JSON_BANK')
    // Get all categories to configure bibliography and run AI generation
    const allCategories = await prisma.questionCategory.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-lg border border-blue-100">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-900">
                        <Database className="size-6 text-blue-600" />
                        Banco de Casos Clínicos (IA)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Generación de preguntas basadas en casos clínicos y administración del temario de residentes.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DeleteAllQuestionsButton />
                    <SyncBankDialog />
                </div>
            </div>

            <Tabs defaultValue="rotaciones" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-md border">
                    <TabsTrigger value="rotaciones" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700">
                        <FolderOpen className="size-4" />
                        Carpetas de Casos
                    </TabsTrigger>
                    <TabsTrigger value="bibliografia" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700">
                        <BookOpen className="size-4" />
                        Bibliografía Oficial
                    </TabsTrigger>
                    <TabsTrigger value="generador" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-700">
                        <Sparkles className="size-4" />
                        Generador con IA
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: ROTATIONS / CASES EXPLORER */}
                <TabsContent value="rotaciones" className="space-y-4">
                    <div className="flex justify-end">
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
                                                <p className="text-sm">Usa el botón "Sincronizar Banco" o el "Generador con IA" para cargar preguntas.</p>
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
                </TabsContent>

                {/* TAB 2: BIBLIOGRAPHY EDITOR */}
                <TabsContent value="bibliografia">
                    <BibliografiaTab categories={allCategories} />
                </TabsContent>

                {/* TAB 3: AI GENERATOR */}
                <TabsContent value="generador">
                    <GeneradorIaTab categories={allCategories} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
