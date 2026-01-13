"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { updateQuestion, getCategories } from "@/app/lib/questions"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Pencil, Loader2, Trash2 } from "lucide-react"
import { MarkdownEditor } from "@/components/markdown-editor"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
    text: z.string().min(1, "La pregunta debe tener texto"),
    category_id: z.string().min(1, "Seleccione una categoría"),
    options: z.array(z.object({
        id: z.string(),
        text: z.string().min(1, "La opción no puede estar vacía"),
        is_correct: z.boolean()
    })).min(2, "Debe tener al menos 2 opciones"),
    correct_option: z.string().min(1, "Debe seleccionar una respuesta correcta"),
    explanation: z.string().optional()
})

interface EditQuestionDialogProps {
    question: any
}

export function EditQuestionDialog({ question }: EditQuestionDialogProps) {
    const [open, setOpen] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(question.image_url)
    const [removeImage, setRemoveImage] = useState(false)

    // Parse options from JSON string if needed, or assume it's already an object if passed from server component props
    // Typically in page.tsx props are serialized. If 'options' is a string we parse it.
    const initialOptions = typeof question.options === 'string'
        ? JSON.parse(question.options)
        : question.options || []

    // Determine potentially correct option
    const initialCorrect = initialOptions.find((o: any) => o.is_correct)?.id || "A"

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            text: question.text,
            category_id: question.category_id,
            correct_option: initialCorrect,
            explanation: question.explanation || "",
            options: initialOptions.length > 0 ? initialOptions : [
                { id: "A", text: "", is_correct: true },
                { id: "B", text: "", is_correct: false },
                { id: "C", text: "", is_correct: false },
                { id: "D", text: "", is_correct: false },
            ]
        },
    })

    useEffect(() => {
        if (open) {
            getCategories().then(setCategories)
            // Reset form state to current question values
            setCurrentImageUrl(question.image_url)
            setRemoveImage(false)
            setFile(null)
        }
    }, [open, question])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)

        // Map correct_option to the options array
        const mappedOptions = values.options.map(opt => ({
            ...opt,
            is_correct: opt.id === values.correct_option
        }))

        const formData = new FormData()
        formData.append('id', question.id)
        formData.append('text', values.text)
        formData.append('explanation', values.explanation || "")
        formData.append('category_id', values.category_id)
        formData.append('options', JSON.stringify(mappedOptions))

        if (removeImage) {
            formData.append('remove_image', 'true')
        } else if (file) {
            formData.append('file', file)
        }

        const result = await updateQuestion(formData)
        setLoading(false)

        if (result.success) {
            setOpen(false)
            // Ideally toast success
            // alert("Pregunta actualizada")
        } else {
            alert(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Pregunta</DialogTitle>
                    <DialogDescription>
                        Modifique el contenido de la pregunta.
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

                        {/* Image Handling */}
                        <div className="space-y-2 border p-4 rounded-md">
                            <Label>Imagen</Label>

                            {!removeImage && currentImageUrl && (
                                <div className="relative mb-2">
                                    <img src={currentImageUrl} alt="Pregunta" className="h-32 object-contain rounded border bg-muted" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-0 right-0"
                                        onClick={() => setRemoveImage(true)}
                                    >
                                        <Trash2 className="size-3 mr-1" /> Quitar
                                    </Button>
                                </div>
                            )}

                            {removeImage && (
                                <div className="text-xs text-destructive mb-2 font-medium">La imagen será eliminada al guardar.</div>
                            )}

                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setFile(e.target.files[0])
                                        setRemoveImage(false)
                                    }
                                }}
                            />
                            <p className="text-xs text-muted-foreground">Suba una nueva imagen para reemplazar la actual.</p>
                        </div>

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
                                            {["A", "B", "C", "D", "E"].map((letter, index) => {
                                                // Only show E if it exists in data or if user adds it? 
                                                // For now stick to strict index mapping or safer approach
                                                const currentOptions = form.watch('options')
                                                if (index >= currentOptions.length) return null

                                                return (
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
                                                )
                                            })}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                    {/* Ability to add/remove options could be added here if needed */}
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="explanation"
                            render={({ field }) => (
                                <FormItem>
                                    <MarkdownEditor
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        placeholder="Explique por qué esta opción es la correcta..."
                                        label="Justificación de la Respuesta Correcta"
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    )
}
