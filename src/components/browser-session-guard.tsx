'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export function BrowserSessionGuard() {
    useEffect(() => {
        // Check if the session flag exists in sessionStorage
        // sessionStorage is cleared when the page session ends (closing the browser/tab).
        const isSessionValid = sessionStorage.getItem('session_active');

        if (!isSessionValid) {
            console.log('No active browser session found. Signing out...');
            // If the flag is missing, it means this is a new browser session (e.g. reopened browser)
            // even if the auth cookie persisted. We force a logout to strictly enforce "Close Browser = Logout".
            signOut({ callbackUrl: '/login' });
        }
    }, []);

    return null;
}
