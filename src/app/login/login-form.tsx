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
                <div className="inline-flex items-center gap-2 mb-4">
                    <span className="text-3xl font-black tracking-wider text-white">UCR</span>
                    <span className="text-3xl font-thin text-cyan-400 mx-1">|</span>
                    <span className="text-3xl font-black tracking-wider" style={{ color: '#00ffaa' }}>SEP</span>
                </div>
                <p className="text-xs text-cyan-300/70 tracking-widest uppercase">
                    Sistema de Postgrados Médicos (SEP)
                </p>
                <p className="text-xs text-cyan-300/50 tracking-wider">
                    Universidad de Costa Rica
                </p>
            </div>

            {/* Glass Panel */}
            <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
                {/* Corner decorations */}
                <div className="absolute top-4 left-4 text-cyan-400/30">
                    <Activity className="size-8" />
                </div>
                <div className="absolute top-4 right-4 text-cyan-400/30">
                    <Dna className="size-8" />
                </div>
                <div className="absolute bottom-4 left-4 text-cyan-400/20">
                    <Activity className="size-6" />
                </div>
                <div className="absolute bottom-4 right-4 text-cyan-400/20">
                    <Dna className="size-6" />
                </div>

                <form
                    action={formAction}
                    autoComplete="off"
                    onSubmit={() => sessionStorage.setItem('session_active', 'true')}
                    className="space-y-5"
                >
                    <div className="space-y-2">
                        <Label htmlFor="cedula" className="text-cyan-300 text-sm tracking-wide uppercase font-medium">
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
                            className="bg-white/5 border-cyan-500/30 text-white placeholder:text-white/30 focus:border-cyan-400 focus:ring-cyan-400/20 h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-cyan-300 text-sm tracking-wide uppercase font-medium">
                            Contraseña
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            className="bg-white/5 border-cyan-500/30 text-white placeholder:text-white/30 focus:border-cyan-400 focus:ring-cyan-400/20 h-11"
                        />
                    </div>

                    {errorMessage && (
                        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <AlertCircle className="size-4 flex-shrink-0" />
                            {errorMessage}
                        </div>
                    )}

                    {timeoutMessage && (
                        <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <Clock className="size-4 flex-shrink-0" />
                            {timeoutMessage}
                        </div>
                    )}

                    <div className="pt-2 space-y-3">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full h-12 rounded-lg font-bold text-sm tracking-widest uppercase transition-all duration-300 relative overflow-hidden"
                            style={{
                                background: isPending ? 'rgba(0,255,170,0.1)' : 'transparent',
                                border: '1.5px solid #00ffaa',
                                color: '#00ffaa',
                                boxShadow: '0 0 12px rgba(0, 255, 170, 0.3), inset 0 0 12px rgba(0, 255, 170, 0.05)',
                            }}
                        >
                            {isPending ? 'Verificando...' : 'Iniciar Sesión'}
                            <span className="block text-[10px] font-normal tracking-wider opacity-60">
                                SEP UCR
                            </span>
                        </button>

                        <div className="flex justify-center">
                            <ForgotPasswordDialog />
                        </div>
                    </div>
                </form>
            </div>

            <p className="text-center text-xs text-cyan-300/30 mt-6 tracking-widest uppercase">
                Bienvenidos al SEP · Medicina Familiar
            </p>
        </div>
    );
}
