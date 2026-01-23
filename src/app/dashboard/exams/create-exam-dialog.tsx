"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createExam, getCourses, getExamFolders } from "@/app/lib/exams"
import { getCategories } from "@/app/lib/questions" // Reuse this action
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
import { Plus } from "lucide-react"

const formSchema = z.object({
    assigned_to_user_id: z.string().optional(),
    folder_id: z.string().optional(),
    exam_type: z.string({ required_error: "Seleccione un tipo de examen" }),
    categories: z.array(z.string()).min(1, "Seleccione al menos una categoría"),
    duration_minutes: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Debe ser un número mayor a 0"),
    total_questions: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Debe ser mayor a 0"),
    start_window: z.date(),
    end_window: z.date(),
    claims_start: z.date().optional(),
    claims_end: z.date().optional(),
}).refine(data => data.end_window > data.start_window, {
    message: "La fecha final debe ser posterior a la inicial",
    path: ["end_window"]
})

const EXAM_TYPES = [
    "Examen Parcial",
    "Examen Final",
    "Examen de Reposición",
    "Quiz",
    "Examen General"
]

export function CreateExamDialog() {
    const [open, setOpen] = useState(false)
    const [residents, setResidents] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [folders, setFolders] = useState<any[]>([])
    const [categorySearch, setCategorySearch] = useState("")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            assigned_to_user_id: "all",
            folder_id: "root",
            categories: [],
            duration_minutes: "60",
            total_questions: "20",
        },
    })

    useEffect(() => {
        // Fetch residents instead of courses
        fetch('/api/residents').then(r => r.json()).then(setResidents).catch(() => { })
        getCategories().then(setCategories)
        getExamFolders().then(setFolders).catch(() => { })
    }, [])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Construct Title
        let examTitle = values.exam_type
        if (values.folder_id && values.folder_id !== 'root') {
            const folderName = folders.find(f => f.id === values.folder_id)?.name
            if (folderName) {
                examTitle = `${values.exam_type} - ${folderName}`
            }
        }

        // Convert string dates to Date objects for server
        const payload = {
            ...values,
            title: examTitle,
            start_window: values.start_window,
            end_window: values.end_window,
            claims_start: values.claims_start || null,
            claims_end: values.claims_end || null,
        }

        const result = await createExam(payload)
        if (result.success) {
            setOpen(false)
            form.reset()
        } else {
            alert(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Nuevo Examen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Programar Examen</DialogTitle>
                    <DialogDescription>
                        Defina temas, duración y ventana de tiempo exacta.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="folder_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Periodo Académico</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione Periodo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="root">General (Sin Periodo)</SelectItem>
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
                                name="exam_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Evaluación</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione Tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {EXAM_TYPES.map(type => (
                                                    <SelectItem key={type} value={type}>
                                                        {type}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="assigned_to_user_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Residente</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Todos los residentes" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los residentes</SelectItem>
                                            {residents.map(resident => (
                                                <SelectItem key={resident.id} value={resident.id}>
                                                    {resident.nombre} - {resident.cedula}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                            name="duration_minutes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Duración (min)</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
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
                        <Button type="submit">Programar Examen</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
        </Dialog >
    )
}
