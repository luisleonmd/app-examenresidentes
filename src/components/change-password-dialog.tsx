'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { changePassword } from '@/app/lib/actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LockKeyhole, Loader2, KeyRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? 'Actualizando...' : 'Cambiar Contraseña'}
        </Button>
    );
}

export function ChangePasswordDialog() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState<{ success: boolean; message: string } | null>(null);

    async function clientAction(formData: FormData) {
        setMessage(null);
        const result = await changePassword(null, formData);
        setMessage(result);
        if (result.success) {
            // Optional: close dialog after a delay or let user see success message
            setTimeout(() => setOpen(false), 2000);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) setMessage(null);
        }}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <KeyRound className="h-4 w-4" />
                    <span className="hidden md:inline">Cambiar Clave</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cambiar Contraseña</DialogTitle>
                    <DialogDescription>
                        Ingrese su contraseña actual y la nueva contraseña que desea utilizar.
                    </DialogDescription>
                </DialogHeader>
                <form action={clientAction} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <div className="relative">
                            <LockKeyhole className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                required
                                className="pl-9"
                                placeholder="******"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <div className="relative">
                            <LockKeyhole className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                required
                                minLength={6}
                                className="pl-9"
                                placeholder="Min. 6 caracteres"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                        <div className="relative">
                            <LockKeyhole className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                                className="pl-9"
                                placeholder="Repita la nueva contraseña"
                            />
                        </div>
                    </div>

                    {message && (
                        <Alert variant={message.success ? 'default' : 'destructive'} className={message.success ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : ''}>
                            <AlertTitle>{message.success ? '¡Éxito!' : 'Error'}</AlertTitle>
                            <AlertDescription>{message.message}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className="pt-4">
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
