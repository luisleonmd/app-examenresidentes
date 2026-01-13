"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createResource } from "@/app/lib/resources"
import { Loader2, Plus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function UploadResourceDialog({ defaultType, triggerText }: { defaultType?: string, triggerText?: string }) {
    const [open, setOpen] = useState(false)
    const [type, setType] = useState(defaultType || "LINK")
    // State to toggle between Link and File input when defaultType is "LINK" (used for Temario)
    const [isLinkFile, setIsLinkFile] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean, error?: string } | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setResult(null)

        const formData = new FormData(event.currentTarget)
        // If it's a "LINK" type but user chose to upload a file, we treat it as a DOCUMENT (or just store file)
        // But for categorization purposes, if the user clicked "Temario" (LINK), we want it to show up there.
        // The current backend uses 'type' to filter. 
        // If we want it to show up in the "Temario" section (which filters by LINK), we might need to change backend or filtering.
        // EASIER: If isLinkFile is true, we submit as "SYLLABUS" (new type) or "DOCUMENT" but instruct user.
        // Let's rely on the SECTION to determine display. 
        // We will submit 'LINK' type but if it has a file, backend handles it? 
        // Currently backend: if type !== 'LINK' requires file. If type === 'LINK' requires url.
        // We need to change the submitted type if it's a file upload for Temario.
        // Let's use 'DOCUMENT' if they upload a file, even if they started in "Temario".
        // BUT then it will appear in "Documentos" section.
        // User wants it to appear in "Temario" section.
        // So we should use a new type 'SYLLABUS' for everything in that card?
        // OR simply allow 'LINK' type to have a file in backend.

        // Let's modify the filtering logic in frontend later. For now let's use 'SYLLABUS' if it's for the temario card.
        // If defaultType is LINK (Temario card), we can allow switching to SYLLABUS_FILE or SYLLABUS_LINK.

        let initialType = type
        if (defaultType === 'LINK') {
            // If user wants to upload a file in Temario section
            if (isLinkFile) {
                formData.set('type', 'SYLLABUS_FILE')
            } else {
                formData.set('type', 'SYLLABUS_LINK')
            }
        } else if (defaultType === 'DOCUMENT') {
            // For Support Material (Documentos de Apoyo)
            // If isLinkFile is true, it means they chose "Enlace / Web", so we send DOCUMENT_LINK
            // If isLinkFile is false (default), it's a file, so DOCUMENT_FILE
            // NOTE: Variable name isLinkFile is confusing here because for DOCUMENT, "File" mode is default (isLinkFile=false).
            // And "Link" mode means isLinkFile=true.
            // Let's check the JSX toggles below to be sure.
            // Toggle DOCUMENT: checked={isLinkFile} onChange={() => setIsLinkFile(true)} -> Label: "Enlace / Web"
            // So isLinkFile=true IS A LINK.
            if (isLinkFile) {
                formData.set('type', 'DOCUMENT_LINK')
            } else {
                formData.set('type', 'DOCUMENT_FILE')
            }
        } else {
            formData.set('type', type)
        }

        const res = await createResource(formData)
        setResult(res)
        setIsLoading(false)

        if (res.success) {
            setOpen(false)
        }
    }

    // Function to get accepted file types
    const getAcceptTypes = (t: string) => {
        switch (t) {
            case 'ROTATION_IMAGE': return "image/*";
            case 'DOCUMENT': return ".pdf,.doc,.docx,.xls,.xlsx,.html,.htm"; // Added Excel and HTML
            default: return "*";
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant={defaultType ? "ghost" : "default"} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {triggerText || "Agregar Recurso"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Recurso Académico</DialogTitle>
                    <DialogDescription>
                        Comparta documentos, enlaces o imágenes de rotaciones con los residentes.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" name="title" required placeholder="Ej: Temario 2026 o Cronograma" />
                    </div>

                    {/* Toggle for Temario Section */}
                    {defaultType === 'LINK' && (
                        <div className="flex items-center space-x-4 mb-2">
                            <Label className="text-sm text-muted-foreground">Formato:</Label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="mode-link"
                                    name="mode"
                                    checked={!isLinkFile}
                                    onChange={() => setIsLinkFile(false)}
                                    className="accent-primary"
                                />
                                <label htmlFor="mode-link" className="text-sm cursor-pointer">Enlace URL</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="mode-file"
                                    name="mode"
                                    checked={isLinkFile}
                                    onChange={() => setIsLinkFile(true)}
                                    className="accent-primary"
                                />
                                <label htmlFor="mode-file" className="text-sm cursor-pointer">Archivo (PDF/Word/Excel)</label>
                            </div>
                        </div>
                    )}

                    {/* Toggle for Documentos de Apoyo Section (Allowing Links now too) */}
                    {defaultType === 'DOCUMENT' && (
                        <div className="flex items-center space-x-4 mb-2">
                            <Label className="text-sm text-muted-foreground">Formato:</Label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="doc-mode-file"
                                    name="doc-mode"
                                    checked={!isLinkFile} // Reuse state variable, slightly confusing name but functional since only one dialog active
                                    onChange={() => setIsLinkFile(false)}
                                    className="accent-primary"
                                />
                                <label htmlFor="doc-mode-file" className="text-sm cursor-pointer">Archivo</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="doc-mode-link"
                                    name="doc-mode"
                                    checked={isLinkFile}
                                    onChange={() => setIsLinkFile(true)}
                                    className="accent-primary"
                                />
                                <label htmlFor="doc-mode-link" className="text-sm cursor-pointer">Enlace / Web</label>
                            </div>
                        </div>
                    )}

                    {!defaultType && (
                        <div className="grid gap-2">
                            <Label htmlFor="type">Tipo de Recurso</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ROTATION_IMAGE">Rotaciones (Imagen)</SelectItem>
                                    <SelectItem value="DOCUMENT">Documentos (PDF/Word/Excel)</SelectItem>
                                    <SelectItem value="LINK">Temario / Enlaces</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Rendering Logic:
                        If LINK type: 
                            - default is URL (!isLinkFile)
                            - can be FILE (isLinkFile) -> SYLLABUS_FILE
                        
                        If DOCUMENT type:
                            - default is FILE (!isLinkFile) -> DOCUMENT_FILE (or default)
                            - can be URL (isLinkFile) -> DOCUMENT_LINK
                    */}

                    {((type === "LINK" && !isLinkFile) || (type === "DOCUMENT" && isLinkFile)) ? (
                        <div className="grid gap-2">
                            <Label htmlFor="url">URL del Enlace</Label>
                            <Input id="url" name="url" required placeholder="https://..." type="url" />
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            <Label htmlFor="file">Archivo</Label>
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                required
                                accept={
                                    type === 'DOCUMENT' ? ".pdf,.doc,.docx,.xls,.xlsx,.html,.htm,.png,.jpg,.jpeg,.gif" :
                                        (isLinkFile && type === 'LINK') ? ".pdf,.doc,.docx,.xls,.xlsx,.html,.htm,.png,.jpg,.jpeg" :
                                            getAcceptTypes(type)
                                }
                            />
                            <p className="text-xs text-muted-foreground">Admite: PDF, Word, Excel, HTML, Imágenes. (Max 20MB).</p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <Textarea id="description" name="description" placeholder="Breve descripción del contenido..." />
                    </div>

                    {result?.error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
