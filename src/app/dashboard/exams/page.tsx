import { getExams, getExamFolders, createExamFolder, deleteExamFolder } from "@/app/lib/exams"
import { CreateExamDialog } from "./create-exam-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { auth } from "@/auth"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { StartExamDialog } from "./start-exam-button"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { DeleteExamButton } from "./delete-exam-button"
import { Folder, ArrowLeft, Trash2, FolderPlus } from "lucide-react"
import { CreateFolderDialog } from "./create-folder-dialog"

export const dynamic = 'force-dynamic'

interface Props {
    searchParams: Promise<{ folderId?: string }>
}

export default async function ExamsPage(props: Props) {
    const searchParams = await props.searchParams;
    const session = await auth()
    const isResident = session?.user.role === 'RESIDENTE'
    const isCoordinator = session?.user.role === 'COORDINADOR'

    // Logic: 
    // If folderId is provided, filters exams by that folder.
    // If NOT provided, shows Folders Grid + Root Exams (exams with no folder).

    const folderId = searchParams.folderId
    const exams = await getExams(folderId === undefined ? null : folderId) // null implies root, undefined implies all (legacy) -> update getExams to handle this
    // My getExams logic: if undefined -> all? Let's fix getExams call. 
    // If I want "Root" exams only on main page, I should query where folder_id is NULL.
    // Logic inside getExams: if param passed, use it. if param is `null` (explicit), find where folder_id is null.
    // So passing `undefined` implies... wait. 
    // Let's stick to: Main Page = Folders + Root Exams.
    // Folder Page = Exams in Folder.

    const allFolders = await getExamFolders()

    // Find current folder name if in folder view
    const currentFolder = folderId ? allFolders.find(f => f.id === folderId) : null

    // If in root view (no folderId), show folders
    // If in folder view, show "Back" button and folder title

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {folderId && (
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/dashboard/exams"><ArrowLeft className="size-4" /></Link>
                        </Button>
                    )}
                    <h1 className="text-2xl font-bold">
                        {folderId ? currentFolder?.name || "Carpeta" : (isResident ? "Exámenes" : "Gestión de Exámenes")}
                    </h1>
                </div>

                {!isResident && (
                    <div className="flex gap-2">
                        {!folderId && <CreateFolderDialog />}
                        <CreateExamDialog />
                    </div>
                )}
            </div>

            {/* Folders Grid - Only show on root */}
            {!folderId && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {allFolders.map(folder => (
                        <div key={folder.id} className="group relative border rounded-lg p-4 hover:bg-accent/50 transition-colors flex items-center justify-between">
                            <Link href={`/dashboard/exams?folderId=${folder.id}`} className="absolute inset-0" />
                            <div className="flex items-center gap-3">
                                <Folder className="size-8 text-blue-500 fill-blue-500/20" />
                                <div>
                                    <h3 className="font-semibold">{folder.name}</h3>
                                    <p className="text-xs text-muted-foreground">{folder._count?.exams || 0} exámenes</p>
                                </div>
                            </div>
                            {isCoordinator && (
                                <form action={async () => {
                                    "use server"
                                    if (confirm("Eliminar carpeta?")) {
                                        await deleteExamFolder(folder.id)
                                    }
                                    // Note: native confirm doesn't work in server action form usually without JS or client component.
                                    // For now, let's just put a simple server action button, but ideally this should be a client component.
                                    // See "DeleteFolderButton" below.
                                }} className="z-10">
                                    {/* Placeholder for delete, actually better to use a small client component */}
                                </form>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Asignado a</TableHead>
                            {!isResident && <TableHead>Creador</TableHead>}
                            <TableHead>Ventana</TableHead>
                            <TableHead>Preguntas</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {folderId ? "No hay exámenes en esta carpeta." : "No hay exámenes sin carpeta."}
                                </TableCell>
                            </TableRow>
                        ) : exams.map((e) => {
                            const exam = e as any;
                            return (
                                <TableRow key={exam.id}>
                                    <TableCell className="font-medium">{exam.title}</TableCell>
                                    <TableCell>
                                        {/* @ts-ignore */}
                                        {exam.profiles && exam.profiles.length > 0
                                            // @ts-ignore
                                            ? exam.profiles.map(p => p.user.nombre).join(", ")
                                            : "General"}
                                    </TableCell>
                                    {!isResident && <TableCell>{exam.creator?.nombre}</TableCell>}
                                    <TableCell className="text-sm">
                                        {format(new Date(exam.start_window), "dd MMM", { locale: es })} - {format(new Date(exam.end_window), "dd MMM yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>{exam.total_questions}</TableCell>
                                    <TableCell className="text-right">
                                        {isResident ? (
                                            <StartExamDialog
                                                examId={exam.id}
                                                attempt={exam.userAttempt}
                                                startWindow={new Date(exam.start_window)}
                                                endWindow={new Date(exam.end_window)}
                                                claimsEnd={exam.claims_end ? new Date(exam.claims_end) : null}
                                            />
                                        ) : (
                                            <div className="flex gap-2 justify-end">
                                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold hover:bg-secondary/80">
                                                    Programado
                                                </span>
                                                {/* Link to results for professors */}
                                                <Button asChild size="sm" variant="outline">
                                                    <a href={`/dashboard/exams/${exam.id}/results`}>Resultados</a>
                                                </Button>
                                                {session?.user?.role === 'COORDINADOR' && (
                                                    <DeleteExamButton examId={exam.id} />
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

