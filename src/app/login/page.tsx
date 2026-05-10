import { Suspense } from 'react';
import LoginForm from './login-form';
import { ConstellationBackground } from '@/components/constellation-background';

export default function LoginPage() {
    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at center, #011a33 0%, #010a17 70%)' }}>
            <ConstellationBackground />
            {/* Decorative grid lines */}
            <div className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0,195,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,195,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
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
