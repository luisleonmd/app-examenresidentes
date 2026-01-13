"use client"

import { ExportButton } from "@/components/export-button"
import { exportQuestionBank } from "@/app/lib/export-data"

interface ExportQuestionsButtonProps {
    categoryId?: string
}

export function ExportQuestionsButton({ categoryId }: ExportQuestionsButtonProps) {
    return (
        <ExportButton
            onExport={(format) => exportQuestionBank(categoryId, format)}
            label="Exportar Preguntas"
        />
    )
}
