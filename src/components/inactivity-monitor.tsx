'use client';

import { useEffect, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';

const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function InactivityMonitor() {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            signOut({ callbackUrl: '/login' });
        }, TIMEOUT_MS);
    }, []);

    useEffect(() => {
        // Events to monitor
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
        ];

        // Set initial timer
        resetTimer();

        // Add event listeners
        const handleActivity = () => {
            resetTimer();
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]);

    return null;
}
