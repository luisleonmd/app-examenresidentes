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
                {(userRole === 'COORDINADOR' || userRole === 'PROFESOR') && (
                    <UploadResourceDialog />
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Rotations Section */}
                <Card className="col-span-full lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-purple-500" />
                            Rotaciones
                        </CardTitle>
                        <CardDescription>Cronograma y asignaciones visuales</CardDescription>
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

                {/* Documents Section */}
                <Card className="col-span-full md:col-span-1 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Documentos
                        </CardTitle>
                        <CardDescription>Material de estudio y guías</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {DOCUMENTS.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay documentos disponibles.</p>
                        ) : (
                            <ul className="space-y-3">
                                {DOCUMENTS.map((doc) => (
                                    <li key={doc.id} className="flex items-start justify-between p-2 rounded hover:bg-muted/50 transition-colors border">
                                        <div className="space-y-1 min-w-0">
                                            <p className="text-sm font-medium leading-none truncate pr-2">{doc.title}</p>
                                            <p className="text-xs text-muted-foreground">{doc.description}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <a
                                                href={`data:${doc.file_type};base64,${doc.file_data}`}
                                                download={doc.title} // Specify filename
                                                className="text-blue-500 hover:text-blue-700"
                                                title="Descargar"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                            {(userRole === 'COORDINADOR' || userRole === 'PROFESOR') && (
                                                <DeleteButton id={doc.id} />
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Links / Temario Section */}
                <Card className="col-span-full md:col-span-1 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ExternalLink className="h-5 w-5 text-orange-500" />
                            Enlaces y Temarios
                        </CardTitle>
                        <CardDescription>Accesos rápidos a recursos externos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {LINKS.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay enlaces registrados.</p>
                        ) : (
                            <ul className="space-y-3">
                                {LINKS.map((link) => (
                                    <li key={link.id} className="flex items-start justify-between p-2 rounded hover:bg-muted/50 transition-colors border">
                                        <div className="space-y-1 min-w-0">
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium leading-none truncate pr-2 hover:underline text-blue-600 dark:text-blue-400">
                                                {link.title}
                                            </a>
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
