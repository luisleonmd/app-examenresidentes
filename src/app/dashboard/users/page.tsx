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

export default async function UsersPage() {
    const users = await getUsers()

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                <div className="flex gap-2">
                    <ImportUsersDialog />
                    <CreateUserDialog />
                </div>
            </div>

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
                        {users.map((user) => (
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
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
