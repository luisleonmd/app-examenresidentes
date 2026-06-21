"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { 
    BookOpen, 
    Save, 
    Loader2, 
    Trash2, 
    Plus, 
    Globe, 
    FileText, 
    Video, 
    Music, 
    FileUp, 
    Check, 
    ArrowUpRight,
    Search
} from "lucide-react"
import { uploadBibliographyResource, deleteBibliographyResource } from "@/app/lib/bibliography-actions"

interface BibliographyResource {
    id: string
    title: string
    type: "PDF" | "WORD" | "WEB" | "VIDEO" | "AUDIO"
    url: string | null
    file_path: string | null
    text_content: string | null
    created_at: Date
}

interface Category {
    id: string
    name: string
    description: string | null
    bibliographies?: BibliographyResource[]
}

interface BibliografiaTabProps {
    categories: Category[]
}

export function BibliografiaTab({ categories }: BibliografiaTabProps) {
    const [selectedCatId, setSelectedCatId] = useState<string | null>(
        categories.length > 0 ? categories[0].id : null
    )
    const [modalOpen, setModalOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // Form states
    const [title, setTitle] = useState("")
    const [type, setType] = useState<"PDF" | "WORD" | "WEB" | "VIDEO" | "AUDIO">("PDF")
    const [url, setUrl] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [notes, setNotes] = useState("")
    const [fileError, setFileError] = useState<string | null>(null)

    const router = useRouter()

    const selectedCategory = categories.find(c => c.id === selectedCatId)
    const resources = selectedCategory?.bibliographies || []

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            const MAX_SIZE = 50 * 1024 * 1024 // 50 MB
            if (selectedFile.size > MAX_SIZE) {
                setFileError("El archivo excede el límite de 50 MB.")
                setFile(null)
            } else {
                setFileError(null)
                setFile(selectedFile)
                // Auto fill title if empty
                if (!title) {
                    const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name
                    setTitle(nameWithoutExt)
                }
            }
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCatId) return

        if (!title.trim()) {
            alert("El título del recurso es requerido.")
            return
        }

        if (type === "WEB" && !url.trim()) {
            alert("La dirección URL del enlace web es requerida.")
            return
        }

        if (type !== "WEB" && !file) {
            alert("Selecciona un archivo para subir.")
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("categoryId", selectedCatId)
            formData.append("title", title)
            formData.append("type", type)
            if (type === "WEB") {
                formData.append("url", url)
            } else if (file) {
                formData.append("file", file)
            }
            if (notes) {
                formData.append("notes", notes)
            }

            const result = await uploadBibliographyResource(formData)
            if (result.success) {
                setModalOpen(false)
                // Reset form
                setTitle("")
                setUrl("")
                setFile(null)
                setNotes("")
                setFileError(null)
                router.refresh()
            } else {
                alert(result.error || "Ocurrió un error al subir el recurso.")
            }
        } catch (e: any) {
            alert("Error: " + e.message)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar la bibliografía "${name}"?`)
        if (!confirmed) return

        setDeletingId(id)
        try {
            const result = await deleteBibliographyResource(id)
            if (result.success) {
                router.refresh()
            } else {
                alert(result.error || "Ocurrió un error al eliminar el recurso.")
            }
        } catch (e: any) {
            alert("Error: " + e.message)
        } finally {
            setDeletingId(null)
        }
    }

    const getIconForType = (type: string) => {
        switch (type) {
            case "PDF":
                return <FileText className="size-5 text-red-600" />
            case "WORD":
                return <FileText className="size-5 text-blue-600" />
            case "WEB":
                return <Globe className="size-5 text-green-600" />
            case "VIDEO":
                return <Video className="size-5 text-purple-600" />
            case "AUDIO":
                return <Music className="size-5 text-amber-600" />
            default:
                return <BookOpen className="size-5 text-slate-600" />
        }
    }

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar list of Rotations / Courses */}
            <div className="md:col-span-1 border rounded-lg overflow-hidden bg-card max-h-[600px] flex flex-col">
                <div className="p-4 bg-slate-50 border-b space-y-2">
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Rotaciones y Cursos
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar rotación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-9"
                        />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 divide-y">
                    {filteredCategories.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No se encontraron rotaciones.
                        </div>
                    ) : (
                        filteredCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCatId(cat.id)
                                }}
                                className={`w-full text-left p-4 transition-colors text-sm ${
                                    selectedCatId === cat.id
                                        ? "bg-blue-50/70 border-l-4 border-blue-600 font-semibold text-blue-700"
                                        : "hover:bg-slate-50 text-foreground"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 truncate">
                                        <BookOpen className={`size-4 mt-0.5 shrink-0 ${
                                            selectedCatId === cat.id ? "text-blue-600" : "text-slate-400"
                                        }`} />
                                        <span className="truncate">{cat.name}</span>
                                    </div>
                                    <span className="shrink-0 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-normal text-slate-500">
                                        {cat.bibliographies?.length || 0} recs
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Editing Panel */}
            <div className="md:col-span-2">
                {selectedCategory ? (
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between py-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                                    <BookOpen className="size-5 text-blue-600" />
                                    Bibliografía: {selectedCategory.name}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Carga y administra archivos o enlaces web de referencia. La IA leerá su contenido.
                                </CardDescription>
                            </div>

                            {/* Add Resource Dialog */}
                            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-9 text-xs">
                                        <Plus className="size-4" />
                                        Subir Bibliografía
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-blue-900">
                                            <FileUp className="size-5 text-blue-600" />
                                            Subir Nuevo Recurso de Referencia
                                        </DialogTitle>
                                        <DialogDescription>
                                            El archivo se procesará para extraer su texto para el generador de IA. Límite: 50 MB.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleUpload} className="space-y-4 py-2">
                                        <div className="grid grid-cols-3 gap-4 items-end">
                                            {/* Type Select */}
                                            <div className="col-span-1 space-y-2">
                                                <Label htmlFor="type">Tipo</Label>
                                                <Select
                                                    value={type}
                                                    onValueChange={(val) => {
                                                        setType(val as any)
                                                        setFile(null)
                                                        setFileError(null)
                                                    }}
                                                >
                                                    <SelectTrigger id="type">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="PDF">PDF</SelectItem>
                                                        <SelectItem value="WORD">Word (.docx)</SelectItem>
                                                        <SelectItem value="WEB">Enlace Web</SelectItem>
                                                        <SelectItem value="VIDEO">Video (MP4/WebM)</SelectItem>
                                                        <SelectItem value="AUDIO">Audio (MP3/WAV)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Title */}
                                            <div className="col-span-2 space-y-2">
                                                <Label htmlFor="title">Título del Recurso</Label>
                                                <Input
                                                    id="title"
                                                    placeholder="Ej: Guía Diagnóstica de Diabetes"
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* WEB Link URL Input */}
                                        {type === "WEB" ? (
                                            <div className="space-y-2">
                                                <Label htmlFor="url">Dirección URL del Enlace</Label>
                                                <Input
                                                    id="url"
                                                    type="url"
                                                    placeholder="https://ejemplo.com/articulo-medico"
                                                    value={url}
                                                    onChange={(e) => setUrl(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        ) : (
                                            /* File Selector */
                                            <div className="space-y-2">
                                                <Label htmlFor="file">
                                                    Seleccionar archivo {type === "PDF" ? "PDF" : type === "WORD" ? "DOCX" : "Multimedia"}
                                                </Label>
                                                <Input
                                                    id="file"
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept={
                                                        type === "PDF"
                                                            ? ".pdf,application/pdf"
                                                            : type === "WORD"
                                                            ? ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                            : type === "VIDEO"
                                                            ? "video/*"
                                                            : "audio/*"
                                                    }
                                                    required
                                                />
                                                {fileError ? (
                                                    <p className="text-xs text-red-600 font-semibold">{fileError}</p>
                                                ) : (
                                                    <p className="text-[11px] text-muted-foreground">
                                                        Límite máximo: 50 MB por archivo.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Notes / Transcription Text Area */}
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">
                                                {type === "VIDEO" || type === "AUDIO"
                                                    ? "Resumen, notas o transcripción (Opcional pero recomendado)"
                                                    : "Notas o comentarios del archivo (Opcional)"}
                                            </Label>
                                            <Textarea
                                                id="notes"
                                                placeholder={
                                                    type === "VIDEO" || type === "AUDIO"
                                                        ? "Escribe un breve resumen de los puntos clave del archivo multimedia para que la IA los use al redactar preguntas."
                                                        : "Añade notas complementarias para este documento."
                                                }
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="h-20"
                                            />
                                        </div>

                                        <DialogFooter className="pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setModalOpen(false)}
                                                disabled={uploading}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={uploading || (type !== "WEB" && !file)}
                                                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                                        Subiendo...
                                                    </>
                                                ) : (
                                                    "Subir Recurso"
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {resources.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50/50">
                                    <FileUp className="size-12 text-slate-300 mx-auto mb-3" />
                                    <p className="font-medium text-slate-600">No hay bibliografías cargadas aún.</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                                        Sube archivos PDF, Word, videos, audios o enlaces web usando el botón superior para alimentar las preguntas de residentes.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">
                                        Materiales de Referencia Activos
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {resources.map((res) => (
                                            <div
                                                key={res.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm bg-white transition-shadow"
                                            >
                                                <div className="flex items-start gap-3 truncate mr-4">
                                                    <div className="p-2 bg-slate-100 rounded-md shrink-0">
                                                        {getIconForType(res.type)}
                                                    </div>
                                                    <div className="truncate">
                                                        <h5 className="font-semibold text-sm text-slate-800 truncate">
                                                            {res.title}
                                                        </h5>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-150 px-1.5 py-0.5 rounded">
                                                                {res.type}
                                                            </span>
                                                            
                                                            {res.text_content && res.text_content.length > 20 && (
                                                                <span className="text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                                                                    Texto Procesado ({Math.round(res.text_content.length / 1000)}k chars)
                                                                </span>
                                                            )}

                                                            <span className="text-[10px] text-muted-foreground">
                                                                Subido: {new Date(res.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Link to resource if available */}
                                                    {res.url ? (
                                                        <a
                                                            href={res.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors"
                                                            title="Visitar enlace web"
                                                        >
                                                            <ArrowUpRight className="size-4.5" />
                                                        </a>
                                                    ) : res.file_path ? (
                                                        <a
                                                            href={res.file_path}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors"
                                                            title="Ver archivo"
                                                            download
                                                        >
                                                            <FileUp className="size-4.5" />
                                                        </a>
                                                    ) : null}

                                                    {/* Delete button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(res.id, res.title)}
                                                        disabled={deletingId === res.id}
                                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9"
                                                        title="Eliminar de bibliografía"
                                                    >
                                                        {deletingId === res.id ? (
                                                            <Loader2 className="size-4.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="size-4.5" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                            <BookOpen className="size-12 text-slate-300" />
                            <p>Selecciona una rotación o curso para configurar sus bibliografías.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
