"use strict";
"use client"

import { useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getConsolidatedExamReportData } from "@/app/lib/exam-taking"
import { pdf } from "@react-pdf/renderer"
import { ConsolidatedReportTemplate } from "@/components/pdf/consolidated-report-template"

interface ConsolidatedReportButtonProps {
    examId: string
}

export function ConsolidatedReportButton({ examId }: ConsolidatedReportButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            // 1. Fetch Data
            const data = await getConsolidatedExamReportData(examId)

            if (!data.reports || data.reports.length === 0) {
                alert("No hay exámenes entregados para generar el reporte.")
                setLoading(false)
                return
            }

            // 2. Generate PDF Blob
            const blob = await pdf(
                <ConsolidatedReportTemplate
                    exam={data.exam}
                    reports={data.reports as any} // Cast if types mismatch slightly
                />
            ).toBlob()

            // 3. Download
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Reporte_Consolidado_${data.exam.title.replace(/\s+/g, '_')}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error("Error generating report:", error)
            alert("Error al generar el reporte consolidado.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button onClick={handleDownload} disabled={loading} variant="default" className="bg-purple-600 hover:bg-purple-700">
            {loading ? (
                <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generando Consolidado...
                </>
            ) : (
                <>
                    <FileText className="mr-2 size-4" />
                    Reporte Consolidado
                </>
            )}
        </Button>
    )
}
