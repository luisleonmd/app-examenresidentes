import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Subtle decorative blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/60 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-100/60 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-sm px-4">
                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
