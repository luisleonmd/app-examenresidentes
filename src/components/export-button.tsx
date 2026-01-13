"use client"

import { useState, useEffect } from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ExportButtonProps {
    onExport: (format: 'xlsx' | 'csv') => Promise<any>
    label?: string
    variant?: "default" | "outline" | "secondary"
}

export function ExportButton({ onExport, label = "Exportar", variant = "outline" }: ExportButtonProps) {
    const [loading, setLoading] = useState(false)

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleExport = async (format: 'xlsx' | 'csv') => {
        setLoading(true)
        try {
            const result = await onExport(format)

            if (result.success) {
                // Convert base64 to blob and download
                const byteCharacters = atob(result.file)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: result.mimeType })

                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = result.filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            } else {
                alert(result.error || 'Error al exportar')
            }
        } catch (error) {
            console.error('Export error:', error)
            alert('Error al exportar datos')
        } finally {
            setLoading(false)
        }
    }

    if (!mounted) {
        return (
            <Button variant={variant} size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                {label}
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size="sm" disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'Exportando...' : label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileText className="mr-2 h-4 w-4" />
                    CSV (.csv)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
