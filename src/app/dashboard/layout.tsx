import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { auth, signOut } from "@/auth"
import { SearchButton } from "@/components/search-button"
import { NotificationsBell } from "@/components/notifications-bell"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()
    return (
        <SidebarProvider>
            <AppSidebar role={session?.user?.role} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 justify-between bg-card">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <h2 className="font-semibold">Panel de Control</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <SearchButton />
                        <NotificationsBell />
                        <span className="text-sm font-medium">{session?.user?.nombre}</span>
                        <form
                            action={async () => {
                                "use server"
                                await signOut({ redirectTo: "/login" })
                            }}
                        >
                            <button className="text-xs text-red-500 hover:text-red-700 font-medium">
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 pt-0 mt-4">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
