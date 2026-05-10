'use client';

import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authenticate } from '@/app/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ForgotPasswordDialog } from './forgot-password-dialog';
import { Activity, Dna, AlertCircle, Clock } from 'lucide-react';

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
                <div className="inline-flex items-center gap-2 mb-3">
                    <span className="text-3xl font-black tracking-wider text-white">UCR</span>
                    <span className="text-2xl font-thin text-sky-400 mx-1">|</span>
                    <span className="text-3xl font-black tracking-wider text-sky-300">SEP</span>
                </div>
                <p className="text-xs text-sky-400/70 tracking-widest uppercase">
                    Sistema de Postgrados Médicos (SEP)
                </p>
                <p className="text-xs text-slate-400/60 tracking-wider mt-0.5">
                    Universidad de Costa Rica
                </p>
            </div>

            {/* Glass Panel */}
            <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
                {/* Subtle corner decorations */}
                <div className="absolute top-4 left-4 text-sky-500/20">
                    <Activity className="size-7" />
                </div>
                <div className="absolute top-4 right-4 text-sky-500/20">
                    <Dna className="size-7" />
                </div>

                <form
                    action={formAction}
                    autoComplete="off"
                    onSubmit={() => sessionStorage.setItem('session_active', 'true')}
                    className="space-y-5"
                >
                    <div className="space-y-2">
                        <Label htmlFor="cedula" className="text-sky-300/80 text-xs tracking-widest uppercase font-semibold">
                            Usuario
                        </Label>
                        <Input
                            id="cedula"
                            name="cedula"
                            type="text"
                            placeholder="000000000"
                            required
                            autoComplete="off"
                            defaultValue=""
                            className="bg-white/5 border-sky-500/25 text-white placeholder:text-white/25 focus:border-sky-400/60 h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sky-300/80 text-xs tracking-widest uppercase font-semibold">
                            Contraseña
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            className="bg-white/5 border-sky-500/25 text-white placeholder:text-white/25 focus:border-sky-400/60 h-11"
                        />
                    </div>

                    {errorMessage && (
                        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <AlertCircle className="size-4 flex-shrink-0" />
                            {errorMessage}
                        </div>
                    )}

                    {timeoutMessage && (
                        <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <Clock className="size-4 flex-shrink-0" />
                            {timeoutMessage}
                        </div>
                    )}

                    <div className="pt-2 space-y-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-200 disabled:opacity-60"
                            style={{
                                background: isPending
                                    ? 'rgba(14,165,233,0.15)'
                                    : 'linear-gradient(135deg, rgba(14,165,233,0.2) 0%, rgba(56,189,248,0.15) 100%)',
                                border: '1.5px solid rgba(14, 165, 233, 0.5)',
                                color: '#7dd3fc',
                                boxShadow: '0 2px 12px rgba(14, 165, 233, 0.15)',
                            }}
                        >
                            <span className="block">{isPending ? 'Verificando...' : 'Iniciar Sesión'}</span>
                            <span className="block text-[10px] font-normal tracking-wider opacity-50 -mt-0.5">SEP UCR</span>
                        </button>

                        <div className="flex justify-center">
                            <ForgotPasswordDialog />
                        </div>
                    </div>
                </form>
            </div>

            <p className="text-center text-xs text-sky-400/25 mt-6 tracking-widest uppercase">
                Bienvenidos al SEP · Medicina Familiar
            </p>
        </div>
    );
}
