"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

interface CategoryFilterProps {
    categories: {
        id: string
        name: string
        _count?: { questions: number }
    }[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const currentCategory = searchParams.get("category") || "all"

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value === "all") {
            params.delete("category")
        } else {
            params.set("category", value)
        }

        // Use push for better history handling
        router.push(`?${params.toString()}`)
        // Force refresh to ensure server component acts
        router.refresh()
    }

    if (!mounted) {
        return (
            <div className="w-[200px] h-10 border rounded-md bg-muted/20 animate-pulse" />
        )
    }

    return (
        <div className="w-[200px]">
            <Select value={currentCategory} onValueChange={handleValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} ({cat._count?.questions || 0})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
