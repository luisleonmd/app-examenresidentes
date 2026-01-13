"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Image as ImageIcon, Trash2, Download } from "lucide-react"
import { deleteResource } from "@/app/lib/resources"
import { useState } from "react"
import { UploadResourceDialog } from "./upload-resource-dialog"

export function ResourcesSection({ resources, userRole }: { resources: any[], userRole?: string }) {
    const ROTATION_IMAGES = resources.filter(r => r.type === 'ROTATION_IMAGE')
    const DOCUMENTS = resources.filter(r => r.type === 'DOCUMENT')
    const LINKS = resources.filter(r => r.type === 'LINK')

    return (
        <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Recursos Académicos</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Rotations Section */}
                <Card className="col-span-full lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5 text-purple-500" />
                                    Rotaciones a Evaluar
                                </CardTitle>
                                <CardDescription>Cronograma y asignaciones visuales</CardDescription>
                            </div>
                            {(userRole === 'COORDINADOR' || userRole === 'PROFESOR') && (
                                <UploadResourceDialog defaultType="ROTATION_IMAGE" triggerText="AGREGAR" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {ROTATION_IMAGES.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <p className="text-sm text-muted-foreground">No hay imágenes de rotación cargadas.</p>
                            </div>
                        ) : (
                            ROTATION_IMAGES.map((img) => (
                                <div key={img.id} className="relative group border rounded-lg overflow-hidden">
                                    {/* Use Base64 data for image source */}
                                    <img
                                        src={`data:${img.file_type};base64,${img.file_data}`}
                                        alt={img.title}
                                        className="w-full h-auto object-cover max-h-[300px]"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs truncate">
                                        {img.title}
                                    </div>
                                    {(userRole === 'COORDINADOR' || userRole === 'PROFESOR') && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DeleteButton id={img.id} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>


                {/* Documents / Support Material Section */}
                <Card className="col-span-full md:col-span-1 lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    Material de ayuda para las evaluaciones
                                </CardTitle>
                                <CardDescription>Recursos de apoyo por rotación</CardDescription>
                            </div>
                            {(userRole === 'COORDINADOR' || userRole === 'PROFESOR') && (
                                <UploadResourceDialog defaultType="DOCUMENT" triggerText="AGREGAR" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {DOCUMENTS.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay documentos disponibles.</p>
                        ) : (
                            <div className="space-y-2">
                                {DOCUMENTS.map((doc) => {
                                    // Determine icon based on file type or if it's a URL
                                    // If doc.url exists, it's a link (or we treat as web resource)
                                    // If doc.file_data exists, it's a file

                                    const isLink = !!doc.url;
                                    const isImage = doc.file_type?.startsWith('image/');

                                    return (
                                        <div key={doc.id} className="flex items-center justify-between group p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                {/* Icon */}
                                                <div className="shrink-0 text-sky-600">
                                                    {isLink ? (
                                                        <ExternalLink className="h-5 w-5" />
                                                    ) : isImage ? (
                                                        <ImageIcon className="h-5 w-5" />
                                                    ) : (
                                                        // Folder icon style from Moodle
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            className="w-8 h-8 text-sky-500"
                                                        >
                                                            <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex flex-col min-w-0">
                                                    {isLink ? (
                                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-base text-blue-700 dark:text-blue-400 hover:underline font-medium truncate">
                                                            {doc.title}
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href={`data:${doc.file_type};base64,${doc.file_data}`}
                                                            download={doc.title}
                                                            className="text-base text-blue-700 dark:text-blue-400 hover:underline font-medium truncate"
                                                        >
                                                            {doc.title}
                                                        </a>
                                                    )}
                                                    {/* Hidden description for now to match screenshot clean look, or show as tooltip? 
                                                    User reference shows just title. Let's keep it simple.
                                                */}
                                                </div>
                                            </div>

                                            {(userRole === 'COORDINADOR' || userRole === 'PROFESOR') && (
                                                <DeleteButton id={doc.id} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Links / Temario Section */}
                <Card className="col-span-full md:col-span-1 lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <ExternalLink className="h-5 w-5 text-orange-500" />
                                    Temario de Rotaciones
                                </CardTitle>
                                <CardDescription>Accesos rápidos y enlaces</CardDescription>
                            </div>
                            {(userRole === 'COORDINADOR' || userRole === 'PROFESOR') && (
                                <UploadResourceDialog defaultType="LINK" triggerText="AGREGAR" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {LINKS.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay enlaces registrados.</p>
                        ) : (
                            <ul className="space-y-3">
                                {LINKS.map((link) => (
                                    <li key={link.id} className="flex items-start justify-between p-2 rounded hover:bg-muted/50 transition-colors border">
                                        <div className="space-y-1 min-w-0">
                                            {link.url ? (
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium leading-none truncate pr-2 hover:underline text-blue-600 dark:text-blue-400">
                                                    {link.title}
                                                </a>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <a
                                                        href={`data:${link.file_type};base64,${link.file_data}`}
                                                        download={link.title}
                                                        className="text-sm font-medium leading-none truncate pr-2 hover:underline text-blue-600 dark:text-blue-400"
                                                    >
                                                        {link.title}
                                                    </a>
                                                    <Download className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">{link.description}</p>
                                        </div>
                                        {(userRole === 'COORDINADOR' || userRole === 'PROFESOR') && (
                                            <DeleteButton id={link.id} />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function DeleteButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false)
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            disabled={loading}
            onClick={async () => {
                if (!confirm("¿Seguro que desea eliminar este recurso?")) return;
                setLoading(true)
                await deleteResource(id)
                setLoading(false)
            }}
        >
            {loading ? <span className="animate-spin text-xs">...</span> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}
