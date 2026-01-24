"use client"

import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toggleExamVisibility } from "@/app/lib/exams"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface Props {
    examId: string
    isVisible: boolean
}

export function ExamVisibilityToggle({ examId, isVisible }: Props) {
    const [loading, setLoading] = useState(false)
    const [visible, setVisible] = useState(isVisible)

    async function toggle() {
        setLoading(true)
        const result = await toggleExamVisibility(examId)
        if (result.success) {
            setVisible(!visible)
        } else {
            alert("Error al cambiar visibilidad")
        }
        setLoading(false)
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            disabled={loading}
            title={visible ? "Examen Visible (Click para ocultar)" : "Examen Oculto (Click para mostrar)"}
        >
            {loading ? (
                <Loader2 className="size-4 animate-spin" />
            ) : visible ? (
                <Eye className="size-4 text-green-600" />
            ) : (
                <EyeOff className="size-4 text-muted-foreground" />
            )}
        </Button>
    )
}
