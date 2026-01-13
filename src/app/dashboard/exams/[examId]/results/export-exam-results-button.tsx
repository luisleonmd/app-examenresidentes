"use client"

import { ExportButton } from "@/components/export-button"
import { exportExamResults } from "@/app/lib/export-data"

interface ExportExamResultsButtonProps {
    examId: string
}

export function ExportExamResultsButton({ examId }: ExportExamResultsButtonProps) {
    return (
        <ExportButton
            onExport={(format) => exportExamResults(examId, format)}
            label="Exportar Resultados"
        />
    )
}
