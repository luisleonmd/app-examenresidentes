"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Loader2 } from "lucide-react"
import { createExamFromBank } from "@/app/lib/exams"

const formSchema = z.object({
    title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
    rotations: z.array(z.string()).min(1, "Debe seleccionar al menos una rotación"),
    total_questions: z.coerce.number().min(1, "Debe tener al menos 1 pregunta"),
})

interface Rotation {
    id: string
    name: string
    count: number
}

interface GenerateExamFromBankButtonProps {
    availableRotations: Rotation[]
}

export function GenerateExamFromBankButton({ availableRotations }: GenerateExamFromBankButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            rotations: [],
            total_questions: 10,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        
        try {
            // Check if there are enough questions
            const selectedRotations = availableRotations.filter(r => values.rotations.includes(r.id))
            const maxQuestions = selectedRotations.reduce((sum, r) => sum + r.count, 0)
            
            if (values.total_questions > maxQuestions) {
                alert(`Error: Solo hay ${maxQuestions} preguntas disponibles en las rotaciones seleccionadas.`)
                setLoading(false)
                return
            }

            const result = await createExamFromBank({
                title: values.title,
                categoryIds: values.rotations,
                totalQuestions: values.total_questions
            })

            if (result.success) {
                alert("Examen generado exitosamente.")
                setOpen(false)
                form.reset()
                router.push('/dashboard/exams')
                router.refresh()
            } else {
                alert(result.error || "Error al generar el examen.")
            }
        } catch (error: any) {
            alert(error.message || "Error inesperado")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <FileText className="size-4" />
                    Generar Examen Aleatorio
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Generar Examen desde Banco IA</DialogTitle>
                    <DialogDescription>
                        Selecciona las rotaciones y cuántas preguntas aleatorias deseas incluir.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título del Examen</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Examen Mensual Pediatría y VIH" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="rotations"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel>Rotaciones a Incluir</FormLabel>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
                                        {availableRotations.map((item) => (
                                            <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="rotations"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={item.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, item.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== item.id
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal text-sm cursor-pointer">
                                                                {item.name} <span className="text-muted-foreground">({item.count})</span>
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="total_questions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cantidad de Preguntas</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                Crear Examen
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
