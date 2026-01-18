"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function SessionTimeout() {
    const timerRef = useRef<NodeJS.Timeout>(null);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            // Use client-side signOut, redirect to login
            signOut({ callbackUrl: "/login" });
        }, TIMEOUT_MS);
    }, []);

    useEffect(() => {
        // Events to track activity
        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "scroll",
            "touchstart",
            "click",
        ];

        // Initial timer set
        resetTimer();

        // Event handler wrapper to throttle/debounce could be added, 
        // but for simple reset on activity, direct call is okay if not too frequent.
        // However, mousemove fires very rapidly. Let's throttle it slightly or use a flag.
        let isActivityThrottle = false;

        const handleActivity = () => {
            if (!isActivityThrottle) {
                isActivityThrottle = true;
                resetTimer();
                setTimeout(() => {
                    isActivityThrottle = false;
                }, 1000); // 1 second throttle
            }
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
