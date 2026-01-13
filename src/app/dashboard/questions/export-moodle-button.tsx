"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToMoodleXML, exportToGIFT } from "@/app/lib/moodle-export"

interface ExportMoodleButtonProps {
    categoryId?: string
}

export function ExportMoodleButton({ categoryId }: ExportMoodleButtonProps) {
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleExport = async (format: 'xml' | 'gift') => {
        setLoading(true)
        try {
            const result = format === 'xml'
                ? await exportToMoodleXML(categoryId)
                : await exportToGIFT(categoryId)

            if (result.success && result.data) {
                // Convert base64 to blob and download
                const byteCharacters = atob(result.data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], {
                    type: format === 'xml' ? 'application/xml' : 'text/plain'
                })

                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = result.filename || `export.${format === 'xml' ? 'xml' : 'txt'}`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                alert(result.error || 'Error al exportar')
            }
        } catch (error) {
            console.error('Export error:', error)
            alert('Error al exportar')
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Exportar a Moodle
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading}>
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? 'Exportando...' : 'Exportar a Moodle'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('xml')}>
                    <Download className="h-4 w-4 mr-2" />
                    Moodle XML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('gift')}>
                    <Download className="h-4 w-4 mr-2" />
                    GIFT (Moodle/Classroom)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
