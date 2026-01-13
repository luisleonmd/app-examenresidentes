"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createQuestion, getCategories } from "@/app/lib/questions"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus } from "lucide-react"
import { MarkdownEditor } from "@/components/markdown-editor"

const formSchema = z.object({
    text: z.string().min(10, "La pregunta debe tener al menos 10 caracteres"),
    image_url: z.string().url("Debe ser una URL válida").optional().or(z.literal('')),
    category_id: z.string().min(1, "Seleccione una categoría"),
    options: z.array(z.object({
        id: z.string(),
        text: z.string().min(1, "La opción no puede estar vacía"),
        is_correct: z.boolean()
    })).min(2, "Debe tener al menos 2 opciones"),
    correct_option: z.string().min(1, "Debe seleccionar una respuesta correcta"),
    explanation: z.string().min(10, "Debe explicar por qué es la respuesta correcta")
})

export function CreateQuestionDialog() {
    const [open, setOpen] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: "",
            image_url: "",
            category_id: "",
            correct_option: "A",
            explanation: "",
            options: [
                { id: "A", text: "", is_correct: true },
                { id: "B", text: "", is_correct: false },
                { id: "C", text: "", is_correct: false },
                { id: "D", text: "", is_correct: false },
            ]
        },
    })

    useEffect(() => {
        getCategories().then(setCategories)
    }, [])

    // ... onSubmit ...

    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Map correct_option to the options array
        const mappedOptions = values.options.map(opt => ({
            ...opt,
            is_correct: opt.id === values.correct_option
        }))

        const result = await createQuestion({
            ...values,
            options: mappedOptions
        })

        if (result.success) {
            setOpen(false)
            form.reset()
        } else {
            alert(result.error)
        }
    }

    if (!mounted) {
        return (
            <Button className="gap-2" disabled>
                <Plus className="size-4" />
                Nueva Pregunta (Manual)
            </Button>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="size-4" />
                    Nueva Pregunta (Manual)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Agregar Pregunta</DialogTitle>
                    <DialogDescription>
                        Ingrese el texto de la pregunta y sus opciones.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="category_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione categoría" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="text"
                            render={({ field }) => (
                                <FormItem>
                                    <MarkdownEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Escriba aquí la pregunta..."
                                        label="Enunciado de la Pregunta"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="correct_option"
                            render={({ field }) => (
                                <FormItem className="space-y-4 border p-4 rounded-md">
                                    <FormLabel>Opciones de Respuesta (Marque la correcta)</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-3"
                                        >
                                            {["A", "B", "C", "D"].map((letter, index) => (
                                                <FormItem key={letter} className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value={letter} />
                                                    </FormControl>
                                                    <span className="font-bold w-4 text-center">{letter}</span>
                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.text`}
                                                        render={({ field: inputField }) => (
                                                            <FormItem className="flex-1">
                                                                <FormControl>
                                                                    <Input placeholder={`Opción ${letter}`} {...inputField} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="image_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL de Imagen (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                                    </FormControl>
                                    {field.value && (
                                        <div className="mt-2 border rounded-md p-2">
                                            <img
                                                src={field.value}
                                                alt="Vista previa"
                                                className="max-h-48 mx-auto"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                }}
                                            />
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="explanation"
                            render={({ field }) => (
                                <FormItem>
                                    <MarkdownEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Explique por qué esta opción es la correcta..."
                                        label="Justificación de la Respuesta Correcta"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">Guardar Pregunta</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    )
}
