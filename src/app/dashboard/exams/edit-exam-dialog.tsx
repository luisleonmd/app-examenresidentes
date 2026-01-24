"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { updateExam, getCourses, getExamFolders } from "@/app/lib/exams"
import { getCategories } from "@/app/lib/questions"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pencil } from "lucide-react"

const formSchema = z.object({
    folder_id: z.string().optional(),
    categories: z.array(z.string()).min(1, "Seleccione al menos una categoría"),
    total_questions: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Debe ser mayor a 0"),
    start_window: z.date(),
    end_window: z.date(),
    claims_start: z.date().optional(),
    claims_end: z.date().optional(),
    title: z.string().min(3, "El título es requerido"),
}).refine(data => data.end_window > data.start_window, {
    message: "La fecha final debe ser posterior a la inicial",
    path: ["end_window"]
})

interface Props {
    exam: any
}

export function EditExamDialog({ exam }: Props) {
    const [open, setOpen] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [folders, setFolders] = useState<any[]>([])
    const [categorySearch, setCategorySearch] = useState("")

    // Parse existing categories from JSON string
    const existingCategories = (() => {
        try {
            return JSON.parse(exam.categories) || []
        } catch {
            return []
        }
    })()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            folder_id: exam.folder_id || "root",
            categories: existingCategories,
            total_questions: exam.total_questions.toString(),
            start_window: new Date(exam.start_window),
            end_window: new Date(exam.end_window),
            claims_start: exam.claims_start ? new Date(exam.claims_start) : undefined,
            claims_end: exam.claims_end ? new Date(exam.claims_end) : undefined,
            title: exam.title
        },
    })

    useEffect(() => {
        getCategories().then(setCategories)
        getExamFolders().then(setFolders).catch(() => { })
    }, [])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const payload = {
            ...values,
            claims_start: values.claims_start || null,
            claims_end: values.claims_end || null,
        }

        const result = await updateExam(exam.id, payload)
        if (result.success) {
            setOpen(false)
        } else {
            alert(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Editar Examen">
                    <Pencil className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Examen</DialogTitle>
                    <DialogDescription>
                        Modifique las fechas, preguntas y configuración del examen.
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
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="folder_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Carpeta</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione Carpeta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="root">General (Sin Carpeta)</SelectItem>
                                                {folders.map(folder => (
                                                    <SelectItem key={folder.id} value={folder.id}>
                                                        {folder.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="total_questions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cant. Preguntas</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Categorías de Preguntas</Label>
                            <Input
                                placeholder="Buscar categoría..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="mb-2"
                            />
                            <ScrollArea className="h-[120px] w-full border rounded-md p-2">
                                {categories
                                    .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                    .map((cat) => (
                                        <FormField
                                            key={cat.id}
                                            control={form.control}
                                            name="categories"
                                            render={({ field }) => {
                                                return (
                                                    <FormItem
                                                        key={cat.id}
                                                        className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                                    >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(cat.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, cat.id])
                                                                        : field.onChange(
                                                                            field.value?.filter(
                                                                                (value) => value !== cat.id
                                                                            )
                                                                        )
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer">
                                                            {cat.name}
                                                        </FormLabel>
                                                    </FormItem>
                                                )
                                            }}
                                        />
                                    ))}
                            </ScrollArea>
                            {form.formState.errors.categories && (
                                <p className="text-sm font-medium text-destructive">
                                    {form.formState.errors.categories.message}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_window"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Inicio (Fecha y Hora)</FormLabel>
                                        <DateTimePicker
                                            date={field.value}
                                            setDate={field.onChange}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="end_window"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Fin (Fecha y Hora)</FormLabel>
                                        <DateTimePicker
                                            date={field.value}
                                            setDate={field.onChange}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-4">Periodo de Reclamos (Opcional)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="claims_start"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Inicio Reclamos</FormLabel>
                                            <DateTimePicker
                                                date={field.value}
                                                setDate={field.onChange}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="claims_end"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Fin Reclamos</FormLabel>
                                            <DateTimePicker
                                                date={field.value}
                                                setDate={field.onChange}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
