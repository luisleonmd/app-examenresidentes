'use client';

import { useActionState } from 'react';
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

export default function LoginForm() {
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
            <form action={formAction}>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="cedula">Cédula</Label>
                        <Input
                            id="cedula"
                            name="cedula"
                            type="text"
                            placeholder="110180961"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                    {errorMessage && (
                        <div className="text-sm text-red-500 font-medium">
                            {errorMessage}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" disabled={isPending}>
                        {isPending ? 'Ingresando...' : 'Ingresar'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
