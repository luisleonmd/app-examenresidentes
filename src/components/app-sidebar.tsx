"use client"

import * as React from "react"
import {
    BookOpen,
    Frame,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
    User,
    Users,
    FileText,
    AlertCircle
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
    {
        title: "Inicio",
        url: "/dashboard",
        icon: PieChart,
    },
    {
        title: "Usuarios",
        url: "/dashboard/users",
        icon: Users,
    },
    {
        title: "Banco de Preguntas",
        url: "/dashboard/questions",
        icon: BookOpen,
    },
    {
        title: "Categorías",
        url: "/dashboard/categories",
        icon: Map,
        roles: ['COORDINADOR']
    },
    {
        title: "Exámenes",
        url: "/dashboard/exams",
        icon: FileText,
    },
    {
        title: "Impugnaciones",
        url: "/dashboard/claims",
        icon: AlertCircle,
    },
]

export function AppSidebar({ role, ...props }: { role?: string } & React.ComponentProps<typeof Sidebar>) {
    // Generar items dinámicamente para no mutar la constante global
    const navItems = items.flatMap(item => {
        // Clonar el item para no modificar la referencia global
        const newItem = { ...item }

        if (newItem.title === "Usuarios" && role !== 'COORDINADOR') return []
        if (newItem.title === "Banco de Preguntas" && role === 'RESIDENTE') return []
        if (newItem.title === "Categorías" && role === 'RESIDENTE') return []

        if (newItem.title === "Impugnaciones") {
            if (role === 'RESIDENTE') return []
            newItem.title = "Reclamos" // Ahora es seguro modificar la copia
        }

        return [newItem]
    })

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <SquareTerminal className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">UCR Medicina Familiar</span>
                        <span className="truncate text-xs">Evaluación Residentes</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
                    <SidebarMenu>
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild tooltip={item.title}>
                                    <a href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-2 p-2 border-t">
                            <User className="size-4 opacity-50" />
                            <span className="text-xs text-muted-foreground">Sistema v1.0</span>
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
