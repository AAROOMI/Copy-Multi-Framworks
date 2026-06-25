import { useEffect, useRef } from 'react';
import type { User } from '../types';

export function useAdminSessionTimeout(
    currentUser: User | null,
    onLogout: () => void,
    addNotification?: (message: string, type?: 'success' | 'info') => void
) {
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!currentUser) {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
            return;
        }

        const isAdmin = 
            currentUser.role === 'internal_admin' || 
            currentUser.role === 'Super Admin' || 
            currentUser.email === 'aaroomi@gmail.com';

        // 15 minutes for internal admin, 60 minutes for regular users
        const timeoutDuration = isAdmin ? 15 * 60 * 1000 : 60 * 60 * 1000;

        const handleTimeout = () => {
            if (addNotification) {
                addNotification(
                    isAdmin 
                        ? "Session terminated: 15 minutes of admin inactivity detected." 
                        : "Session terminated due to inactivity.", 
                    "info"
                );
            }
            onLogout();
        };

        const resetTimer = () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
            timeoutIdRef.current = setTimeout(handleTimeout, timeoutDuration);
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        const throttleLimit = 2000; // 2 seconds throttle to prevent extra computations
        let lastEventTime = 0;

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastEventTime > throttleLimit) {
                lastEventTime = now;
                resetTimer();
            }
        };

        events.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Initialize timer on load/mount
        resetTimer();

        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [currentUser, onLogout, addNotification]);
}
