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

import { ToggleStudentViewButton } from "./student-view-toggle"

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

export function AppSidebar({ role, originalRole, isStudentView, ...props }: { role?: string, originalRole?: string, isStudentView?: boolean } & React.ComponentProps<typeof Sidebar>) {
    // Generar items dinámicamente para no mutar la constante global
    const navItems = items.flatMap(item => {
        // Clonar el item para no modificar la referencia global
        const newItem = { ...item }

        if (newItem.title === "Usuarios" && role !== 'COORDINADOR') return []
        // Eliminar Banco de Preguntas ya que se fusionó con Categorías
        if (newItem.title === "Banco de Preguntas") return []
        // Categorías ahora es accesible para todos los roles excepto RESIDENTE
        if (newItem.title === "Categorías" && role === 'RESIDENTE') return []

        if (newItem.title === "Impugnaciones") {
            if (role === 'RESIDENTE') return []
            newItem.title = "Reclamos" // Ahora es seguro modificar la copia
        }

        return [newItem]
    })

    const canToggleStudentView = (originalRole === 'COORDINADOR' || originalRole === 'PROFESOR') && !isStudentView;

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-3">
                    <div className="flex-1 text-left leading-tight">
                        <div className="flex items-center gap-1">
                            <span className="font-black text-sm tracking-wider text-white">UCR</span>
                            <span className="font-thin text-cyan-400 mx-0.5">|</span>
                            <span className="font-black text-sm tracking-wider neon-text">SEP</span>
                        </div>
                        <span className="text-[10px] text-cyan-400/50 uppercase tracking-widest">Medicina Familiar</span>
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
                    {canToggleStudentView && (
                        <SidebarMenuItem>
                            <ToggleStudentViewButton />
                        </SidebarMenuItem>
                    )}
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
