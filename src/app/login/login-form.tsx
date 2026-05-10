'use client';

import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authenticate } from '@/app/lib/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ForgotPasswordDialog } from './forgot-password-dialog';
import { Activity, Dna, AlertCircle, Clock, BookOpen } from 'lucide-react';

export default function LoginForm() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason');
    const [timeoutMessage] = useState(reason === 'timeout' ? 'Se ha desconectado por inactividad.' : '');

    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined
    );

    return (
        <div className="w-full">
            {/* Logo / Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <BookOpen className="size-5 text-white" />
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl font-black text-slate-800 tracking-wide">UCR</span>
                            <span className="text-xl text-blue-400 font-light">|</span>
                            <span className="text-xl font-black text-blue-600 tracking-wide">SEP</span>
                        </div>
                        <p className="text-[10px] text-slate-400 tracking-widest uppercase leading-tight">Medicina Familiar</p>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Bienvenido</h1>
                <p className="text-sm text-slate-500 mt-1">Sistema de Postgrados Médicos · UCR</p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100">
                <form
                    action={formAction}
                    autoComplete="off"
                    onSubmit={() => sessionStorage.setItem('session_active', 'true')}
                    className="space-y-5"
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="cedula" className="text-slate-700 text-sm font-semibold">
                            Cédula / Usuario
                        </Label>
                        <Input
                            id="cedula"
                            name="cedula"
                            type="text"
                            placeholder="000000000"
                            required
                            autoComplete="off"
                            defaultValue=""
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-slate-50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">
                            Contraseña
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-slate-50"
                        />
                    </div>

                    {errorMessage && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                            <AlertCircle className="size-4 flex-shrink-0" />
                            {errorMessage}
                        </div>
                    )}

                    {timeoutMessage && (
                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <Clock className="size-4 flex-shrink-0" />
                            {timeoutMessage}
                        </div>
                    )}

                    <div className="pt-1 space-y-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-11 rounded-xl font-semibold text-sm tracking-wide bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
                        >
                            {isPending ? 'Verificando...' : 'Iniciar Sesión'}
                        </button>

                        <div className="flex justify-center">
                            <ForgotPasswordDialog />
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer icons */}
            <div className="flex items-center justify-center gap-3 mt-6">
                <Activity className="size-4 text-slate-300" />
                <p className="text-xs text-slate-400 tracking-widest uppercase">Universidad de Costa Rica</p>
                <Dna className="size-4 text-slate-300" />
            </div>
        </div>
    );
}
