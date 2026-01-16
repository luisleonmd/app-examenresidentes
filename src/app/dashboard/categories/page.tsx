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

export default async function CategoriesPage() {
    const session = await auth()

    if (session?.user.role !== 'COORDINADOR') {
        redirect('/dashboard')
    }

    const categories = await getCategories()

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
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
        </div>
    )
}
