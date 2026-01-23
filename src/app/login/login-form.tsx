'use client';

import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authenticate } from '@/app/lib/actions';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ForgotPasswordDialog } from './forgot-password-dialog';

export default function LoginForm() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const [timeoutMessage, setTimeoutMessage] = useState(reason === 'timeout' ? 'Se ha desconectado por inactividad.' : '');

    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined
    );

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
                <CardDescription>
                    Ingrese su cédula y contraseña para acceder.
                </CardDescription>
            </CardHeader>
            <form
                action={formAction}
                autoComplete="off"
                onSubmit={() => {
                    // Mark the session as active in this browser tab/window
                    sessionStorage.setItem('session_active', 'true');
                }}
            >
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cedula">Cédula</Label>
                        <Input
                            id="cedula"
                            name="cedula"
                            type="text"
                            placeholder="000000000"
                            required
                            autoComplete="off"
                            defaultValue=""
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="new-password"
                        />
                    </div>
                    {errorMessage && (
                        <div className="text-sm text-red-500 font-medium">
                            {errorMessage}
                        </div>
                    )}
                    {timeoutMessage && (
                        <div className="text-sm text-yellow-600 font-medium">
                            {timeoutMessage}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <div className="flex flex-col w-full gap-2">
                        <Button className="w-full" disabled={isPending}>
                            {isPending ? 'Ingresando...' : 'Ingresar'}
                        </Button>
                        <div className="flex justify-center">
                            <ForgotPasswordDialog />
                        </div>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
