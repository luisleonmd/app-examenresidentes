"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteExamFolder, updateExamFolder } from "@/app/lib/exams"

interface Folder {
    id: string
    name: string
}

export function FolderActions({ folder }: { folder: Folder }) {
    const [openDropdown, setOpenDropdown] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)
    const [loading, setLoading] = useState(false)
    const [newName, setNewName] = useState(folder.name)
    const router = useRouter()

    async function handleRename() {
        if (!newName.trim()) return
        setLoading(true)
        const result = await updateExamFolder(folder.id, newName)
        if (result.success) {
            setShowEditDialog(false)
            setOpenDropdown(false)
            router.refresh()
        } else {
            alert("Error al actualizar la carpeta")
        }
        setLoading(false)
    }

    async function handleDelete() {
        setLoading(true)
        const result = await deleteExamFolder(folder.id)
        if (result.success) {
            setShowDeleteAlert(false)
            setOpenDropdown(false)
            router.refresh()
        } else {
            alert("Error al eliminar la carpeta")
        }
        setLoading(false)
    }

    return (
        <>
            <DropdownMenu open={openDropdown} onOpenChange={setOpenDropdown}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Opciones</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Nombre
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setShowDeleteAlert(true)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Carpeta
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Carpeta</DialogTitle>
                        <DialogDescription>
                            Cambie el nombre de la carpeta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleRename} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar carpeta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la carpeta "{folder.name}".
                            Los exámenes dentro de ella NO se eliminarán, pasarán a la lista general (sin carpeta).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
