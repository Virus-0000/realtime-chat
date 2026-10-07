import { useSyncExternalStore } from "react";

// Re-renders the calling component on an interval so relative labels
// ("Last seen 5 min ago") stay fresh.
const listeners = new Set();
let version = 0;
let timer = null;

const subscribe = (callback) => {
    listeners.add(callback);

    if (!timer) {
        timer = setInterval(() => {
            version += 1;
            listeners.forEach((listener) => listener());
        }, 30000);
    }

    return () => {
        listeners.delete(callback);

        if (listeners.size === 0 && timer) {
            clearInterval(timer);
            timer = null;
        }
    };
};

export default function useTick() {
    return useSyncExternalStore(subscribe, () => version, () => 0);
}
