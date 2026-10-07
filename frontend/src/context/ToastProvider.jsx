import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toastContext";
import ToastViewport from "../components/common/Toast";

let nextId = 1;
const MAX_TOASTS = 4;

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());
    const recent = useRef(new Map());

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const push = useCallback(
        (type, message, options = {}) => {
            if (!message) return null;

            // Ignore identical toasts fired within a second of each other
            const key = `${type}:${message}`;
            const now = Date.now();

            if (now - (recent.current.get(key) || 0) < 1000) return null;
            recent.current.set(key, now);

            const id = nextId++;

            setToasts((current) => [
                ...current.slice(-(MAX_TOASTS - 1)),
                { id, type, message, title: options.title }
            ]);

            timers.current.set(
                id,
                setTimeout(() => dismiss(id), options.duration ?? 4200)
            );

            return id;
        },
        [dismiss]
    );

    useEffect(() => {
        const activeTimers = timers.current;
        return () => activeTimers.forEach((timer) => clearTimeout(timer));
    }, []);

    const api = useMemo(
        () => ({
            success: (message, options) => push("success", message, options),
            error: (message, options) => push("error", message, options),
            info: (message, options) => push("info", message, options),
            dismiss
        }),
        [push, dismiss]
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ToastViewport toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}
