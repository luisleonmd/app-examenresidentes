"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { assignExamProfile, deleteExamProfile } from "@/app/lib/exam-profiles"
import { Search } from "lucide-react"

type ProfileConfig = {
    categoryId: string
    count: number
}

interface AssignmentInterfaceProps {
    examId: string
    users: any[]
    categories: any[]
    initialProfiles: Map<string, ProfileConfig[]>
}

export function AssignmentInterface({ examId, users, categories, initialProfiles }: AssignmentInterfaceProps) {
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [config, setConfig] = useState<ProfileConfig[]>([])
    const [loading, setLoading] = useState(false)
    // Local state to track saved profiles visually
    const [savedProfiles, setSavedProfiles] = useState(initialProfiles)

    // Filter users
    const filteredUsers = users.filter(u => u.nombre.toLowerCase().includes(search.toLowerCase()) || u.cedula.includes(search))

    const handleUserSelect = (userId: string) => {
        setSelectedUser(userId)
        // Load existing config if any, else empty
        const userProfile = savedProfiles.get(userId)
        if (userProfile) {
            setConfig(userProfile)
        } else {
            // Default: Empty config
            setConfig([])
        }
    }

    const toggleCategory = (catId: string) => {
        if (config.find(c => c.categoryId === catId)) {
            setConfig(config.filter(c => c.categoryId !== catId))
        } else {
            setConfig([...config, { categoryId: catId, count: 5 }])
        }
    }

    const updateCount = (catId: string, count: number) => {
        setConfig(config.map(c => c.categoryId === catId ? { ...c, count } : c))
    }

    const handleSave = async () => {
        if (!selectedUser) return
        setLoading(true)
        const res = await assignExamProfile(examId, selectedUser, config)
        setLoading(false)
        if (res.success) {
            // Update local state
            const newMap = new Map(savedProfiles)
            newMap.set(selectedUser, config)
            setSavedProfiles(newMap)
            alert("Configuración guardada")
        } else {
            alert("Error al guardar")
        }
    }

    const handleDelete = async () => {
        if (!selectedUser) return
        if (!confirm("¿Eliminar configuración personalizada y usar la por defecto?")) return

        setLoading(true)
        const res = await deleteExamProfile(examId, selectedUser)
        setLoading(false)

        if (res.success) {
            const newMap = new Map(savedProfiles)
            newMap.delete(selectedUser)
            setSavedProfiles(newMap)
            setConfig([])
            alert("Configuración eliminada")
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Left: User List */}
            <Card className="md:col-span-1 flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Residentes</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    <div className="space-y-1">
                        {filteredUsers.map(u => {
                            const hasProfile = savedProfiles.has(u.id)
                            return (
                                <button
                                    key={u.id}
                                    onClick={() => handleUserSelect(u.id)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between ${selectedUser === u.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                                        }`}
                                >
                                    <div>
                                        <div className="font-medium">{u.nombre}</div>
                                        <div className="text-xs opacity-70">{u.cedula}</div>
                                    </div>
                                    {hasProfile && <div className="ml-2 size-2 rounded-full bg-green-500" title="Configurado" />}
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Right: Configuration */}
            <Card className="md:col-span-2 flex flex-col h-full">
                <CardHeader>
                    <CardTitle>
                        {selectedUser
                            ? (
                                <div className="flex flex-col gap-1">
                                    <span>Configuración Personalizada</span>
                                    <span className="text-xl text-primary font-bold">
                                        {users.find(u => u.id === selectedUser)?.nombre}
                                    </span>
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {users.find(u => u.id === selectedUser)?.cedula}
                                    </span>
                                </div>
                            )
                            : "Seleccione un residente"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    {selectedUser ? (
                        <div className="space-y-4">
                            <div className="bg-muted/50 p-4 rounded-lg border mb-4">
                                <p className="text-sm text-muted-foreground">
                                    Seleccione los temas y la cantidad de preguntas para <strong>{users.find(u => u.id === selectedUser)?.nombre}</strong>.
                                </p>
                            </div>
                            <div className="grid gap-4">
                                {categories.map(cat => {
                                    const isSelected = config.some(c => c.categoryId === cat.id)
                                    const count = config.find(c => c.categoryId === cat.id)?.count || 0

                                    return (
                                        <div key={cat.id} className="flex items-center gap-4 p-3 border rounded bg-card">
                                            <Checkbox
                                                id={cat.id}
                                                checked={isSelected}
                                                onCheckedChange={() => toggleCategory(cat.id)}
                                            />
                                            <div className="flex-1">
                                                <Label htmlFor={cat.id} className="cursor-pointer font-medium">{cat.name}</Label>
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs">Preguntas:</Label>
                                                    <Input
                                                        type="number"
                                                        className="w-20"
                                                        value={count}
                                                        onChange={(e) => updateCount(cat.id, parseInt(e.target.value))}
                                                        min={1}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <div className="text-sm font-medium">
                                    Total Preguntas: {config.reduce((acc, curr) => acc + curr.count, 0)}
                                </div>
                                <div className="flex gap-2">
                                    {savedProfiles.has(selectedUser) && (
                                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                            Restablecer
                                        </Button>
                                    )}
                                    <Button onClick={handleSave} disabled={loading}>
                                        {loading ? "Guardando..." : "Guardar Configuración"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Seleccione un usuario de la lista
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
