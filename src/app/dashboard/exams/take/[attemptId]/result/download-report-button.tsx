"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateExamReport } from "@/app/lib/pdf-reports"

interface DownloadReportButtonProps {
    attemptId: string
}

export function DownloadReportButton({ attemptId }: DownloadReportButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        const result = await generateExamReport(attemptId)
        setLoading(false)

        if (result.success && result.pdf) {
            // Convert base64 to blob and download
            const byteCharacters = atob(result.pdf)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            const blob = new Blob([byteArray], { type: 'application/pdf' })

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = result.filename || 'reporte_examen.pdf'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } else {
            alert(result.error || 'Error al generar el reporte')
        }
    }

    return (
        <Button onClick={handleDownload} disabled={loading} variant="outline">
            {loading ? (
                <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generando...
                </>
            ) : (
                <>
                    <Download className="mr-2 size-4" />
                    Descargar Reporte PDF
                </>
            )}
        </Button>
    )
}
