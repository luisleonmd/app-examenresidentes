import { getQuestions } from "@/app/lib/questions"
import { CreateQuestionDialog } from "./create-question-dialog"

export const dynamic = 'force-dynamic'

import { ImportQuestionsDialog } from "./import-questions-dialog"
import { ImportMoodleDialog } from "./import-moodle-dialog"
import { ImportJSONDialog } from "./import-json-dialog"
import { DeleteQuestionButton } from "./delete-question-button"
import { ViewQuestionDialog } from "./view-question-dialog"
import { EditQuestionDialog } from "./edit-question-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

import { CategoryFilter } from "./category-filter"
import { getCategories } from "@/app/lib/questions"
import { ExportQuestionsButton } from "./export-questions-button"
import { ExportMoodleButton } from "./export-moodle-button"

export default async function QuestionsPage(props: {
    searchParams: Promise<{ category?: string }>
}) {
    const searchParams = await props.searchParams
    const session = await auth()

    // Basic role protection (can be moved to middleware or layout)
    if (session?.user.role === 'RESIDENTE') {
        redirect('/dashboard')
    }

    const questions = await getQuestions(searchParams.category)
    const categories = await getCategories()

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                <h1 className="text-2xl font-bold">Banco de Preguntas</h1>
                <div className="flex flex-wrap gap-2">
                    <CategoryFilter categories={categories} />
                    <ExportQuestionsButton categoryId={searchParams.category} />
                    <ExportMoodleButton categoryId={searchParams.category} />
                    <ImportJSONDialog />
                    <ImportMoodleDialog />
                    <ImportQuestionsDialog />
                    <CreateQuestionDialog />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Pregunta</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead>Autor</TableHead>
                            <TableHead>Versión</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay preguntas registradas. Comience agregando una manualmente o importando un archivo.
                                </TableCell>
                            </TableRow>
                        ) : questions.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell className="font-mono text-xs">{q.id.substring(0, 8)}</TableCell>
                                <TableCell className="max-w-[400px] truncate">{q.text}</TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold hover:bg-secondary/80">
                                        {q.category.name}
                                    </span>
                                </TableCell>
                                <TableCell>{q.author.nombre}</TableCell>
                                <TableCell className="text-center">{q.version}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <ViewQuestionDialog question={q} />
                                        <EditQuestionDialog question={q} />
                                        <DeleteQuestionButton id={q.id} />
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
