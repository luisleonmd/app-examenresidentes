import { getUsers } from "@/app/lib/users"
import { CreateUserDialog } from "./create-user-dialog"
import { ImportUsersDialog } from "./import-users-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DeleteUserButton } from "./delete-user-button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default async function UsersPage(props: { searchParams: Promise<{ role?: string }> }) {
    const searchParams = await props.searchParams;
    const currentRole = searchParams.role || 'ALL';
    const users = await getUsers(searchParams.role);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                <div className="flex gap-2">
                    <ImportUsersDialog />
                    <CreateUserDialog />
                </div>
            </div>

            <Tabs defaultValue={currentRole} key={currentRole} className="w-full">
                <TabsList>
                    <TabsTrigger value="ALL" asChild>
                        <Link href="/dashboard/users">Todos</Link>
                    </TabsTrigger>
                    <TabsTrigger value="RESIDENTE" asChild>
                        <Link href="/dashboard/users?role=RESIDENTE">Residentes</Link>
                    </TabsTrigger>
                    <TabsTrigger value="PROFESOR" asChild>
                        <Link href="/dashboard/users?role=PROFESOR">Profesores</Link>
                    </TabsTrigger>
                    <TabsTrigger value="COORDINADOR" asChild>
                        <Link href="/dashboard/users?role=COORDINADOR">Coordinadores</Link>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cédula</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Cohorte</TableHead>
                            <TableHead>Fecha Creación</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No se encontraron usuarios.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.cedula}</TableCell>
                                    <TableCell>{user.nombre}</TableCell>
                                    <TableCell>{user.email || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            user.role === 'COORDINADOR' ? 'default' :
                                                user.role === 'PROFESOR' ? 'secondary' :
                                                    'outline'
                                        }>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.cohort || "-"}</TableCell>
                                    <TableCell>{user.created_at.toLocaleDateString('es-CR')}</TableCell>
                                    <TableCell className="text-right">
                                        <DeleteUserButton
                                            userId={user.id}
                                            userName={user.nombre}
                                            userRole={user.role}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
