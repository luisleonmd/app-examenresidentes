"use client"

import { Button } from "@/components/ui/button"
import { toggleStudentView } from "@/app/lib/actions"
import { Eye, ShieldAlert } from "lucide-react"
import { useTransition } from "react"

export function StudentViewBanner() {
    const [isPending, startTransition] = useTransition()

    return (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-800 dark:text-yellow-200 px-4 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 font-medium">
                <ShieldAlert className="size-4" />
                Estás viendo la plataforma en Modo Estudiante
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs border-yellow-500/50 hover:bg-yellow-500/20"
                onClick={() => startTransition(async () => { await toggleStudentView(false) })}
                disabled={isPending}
            >
                {isPending ? "Restaurando..." : "Volver a Modo Administrador"}
            </Button>
        </div>
    )
}

export function ToggleStudentViewButton() {
    const [isPending, startTransition] = useTransition()

    return (
        <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
            onClick={() => startTransition(async () => { await toggleStudentView(true) })}
            disabled={isPending}
        >
            <Eye className="size-4 mr-2" />
            {isPending ? "Cambiando..." : "Ver como Estudiante"}
        </Button>
    )
}
