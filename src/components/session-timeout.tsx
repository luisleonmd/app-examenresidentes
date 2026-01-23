import { useEffect, useRef, useCallback, useState } from "react";
import { signOut } from "next-auth/react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_MS = 12 * 60 * 1000; // 12 minutes (Warning appears 3 mins before timeout)

export function SessionTimeout() {
    const [showWarning, setShowWarning] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

        setShowWarning(false);

        // Warning Timer (Logic: 12 minutes)
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
        }, WARNING_MS);

        // Session Kill Timer (Logic: 15 minutes)
        timerRef.current = setTimeout(() => {
            signOut({ callbackUrl: "/login?reason=timeout" });
        }, TIMEOUT_MS);
    }, []);

    useEffect(() => {
        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

        let isActivityThrottle = false;
        const handleActivity = () => {
            if (!isActivityThrottle) {
                isActivityThrottle = true;
                resetTimer();
                setTimeout(() => isActivityThrottle = false, 1000);
            }
        };

        events.forEach((event) => window.addEventListener(event, handleActivity));
        resetTimer();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            events.forEach((event) => window.removeEventListener(event, handleActivity));
        };
    }, [resetTimer]);

    return (
        <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Sigues ahí?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Su sesión se cerrará en menos de 3 minutos por inactividad.
                        Mueva el cursor o presione una tecla para continuar conectado.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={resetTimer}>
                        Seguir Conectado
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
