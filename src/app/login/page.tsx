import { Suspense } from 'react';
import LoginForm from './login-form';
import { ConstellationBackground } from '@/components/constellation-background';

export default function LoginPage() {
    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d1f35 0%, #112240 50%, #0a1929 100%)' }}>
            <ConstellationBackground />
            {/* Subtle grid overlay */}
            <div className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />
            <div className="relative z-10 w-full max-w-sm px-4">
                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
