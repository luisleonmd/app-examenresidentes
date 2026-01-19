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
import { DeleteCategoryButton } from "./delete-category-button"
import { EditCategoryButton } from "./edit-category-button"
import { MergeCategoryButton } from "./merge-category-button"
import { ViewCategoryQuestionsButton } from "./view-category-questions-button"
import { DeleteAllCategoriesButton } from "./delete-all-categories-button"
import { ClearCategoryButton } from "./clear-category-button"

// Components from Questions Page
import { CreateQuestionDialog } from "../questions/create-question-dialog"
import { ImportQuestionsDialog } from "../questions/import-questions-dialog"
import { ImportMoodleDialog } from "../questions/import-moodle-dialog"
import { ImportJSONDialog } from "../questions/import-json-dialog"
import { ExportQuestionsButton } from "../questions/export-questions-button"
import { ExportMoodleButton } from "../questions/export-moodle-button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function CategoriesPage(props: {
    searchParams: Promise<{ category?: string }>
}) {
    const searchParams = await props.searchParams
    const session = await auth()

    // Prevent access for RESIDENTE
    if (session?.user.role === 'RESIDENTE') {
        redirect('/dashboard')
    }

    const categories = await getCategories()
    const isCoordinador = session?.user.role === 'COORDINADOR'

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Catálogo</h1>
            </div>

            <Tabs defaultValue="questions" className="w-full">
                {isCoordinador && (
                    <TabsList>
                        <TabsTrigger value="questions">Banco de Preguntas</TabsTrigger>
                        <TabsTrigger value="categories">Administrar Categorías</TabsTrigger>
                    </TabsList>
                )}

                <TabsContent value="questions" className="space-y-4 mt-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex flex-wrap gap-2">
                            {isCoordinador && (
                                <>
                                    <ExportQuestionsButton categoryId={searchParams.category} />
                                    <ExportMoodleButton categoryId={searchParams.category} />
                                    <ImportJSONDialog />
                                    <ImportMoodleDialog />
                                    <ImportQuestionsDialog />
                                    <CreateQuestionDialog />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead className="text-center">Preguntas</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                            No hay categorías registradas.
                                        </TableCell>
                                    </TableRow>
                                ) : categories.map((cat) => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                {cat._count?.questions || 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <ViewCategoryQuestionsButton
                                                    categoryId={cat.id}
                                                    categoryName={cat.name}
                                                    questionCount={cat._count?.questions || 0}
                                                    canEdit={isCoordinador}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {isCoordinador && (
                    <TabsContent value="categories" className="space-y-4 mt-4">
                        <div className="flex justify-end">
                            <DeleteAllCategoriesButton />
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-center">Preguntas</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                No hay categorías registradas.
                                            </TableCell>
                                        </TableRow>
                                    ) : categories.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-medium">{cat.name}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                    {cat._count?.questions || 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <ViewCategoryQuestionsButton
                                                        categoryId={cat.id}
                                                        categoryName={cat.name}
                                                        questionCount={cat._count?.questions || 0}
                                                        canEdit={isCoordinador}
                                                    />
                                                    <EditCategoryButton
                                                        id={cat.id}
                                                        name={cat.name}
                                                    />
                                                    <MergeCategoryButton
                                                        categoryId={cat.id}
                                                        categoryName={cat.name}
                                                        questionCount={cat._count?.questions || 0}
                                                        allCategories={categories.map(c => ({ id: c.id, name: c.name }))}
                                                    />
                                                    <ClearCategoryButton
                                                        id={cat.id}
                                                        name={cat.name}
                                                        questionCount={cat._count?.questions || 0}
                                                    />
                                                    <DeleteCategoryButton
                                                        id={cat.id}
                                                        name={cat.name}
                                                        questionCount={cat._count?.questions || 0}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}
