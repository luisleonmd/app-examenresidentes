import { getExams } from "@/app/lib/exams"
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

export default async function ExamsPage() {
    const session = await auth()
    const exams = await getExams()
    const isResident = session?.user.role === 'RESIDENTE'

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{isResident ? "Exámenes Disponibles" : "Gestión de Exámenes"}</h1>
                {!isResident && <CreateExamDialog />}
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Asignado a</TableHead>
                            <TableHead>Curso</TableHead>
                            {!isResident && <TableHead>Creador</TableHead>}
                            <TableHead>Ventana</TableHead>
                            <TableHead>Preguntas</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No hay exámenes programados.
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
                                    <TableCell>{exam.course?.name}</TableCell>
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
