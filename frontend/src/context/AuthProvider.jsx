import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContext";
import { useToast } from "./toastContext";
import { normalizeUser } from "../utils/user";

const getTokenExpiry = (token) => {
    try {
        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );

        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
};

// Reads the session saved by a previous visit (same localStorage keys the
// original app used, so existing logins keep working).
const readSession = () => {
    const token = localStorage.getItem("token");

    if (!token) return { token: null, user: null };

    const expiry = getTokenExpiry(token);

    if (expiry && expiry <= Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return { token: null, user: null };
    }

    try {
        return {
            token,
            user: normalizeUser(JSON.parse(localStorage.getItem("user")))
        };
    } catch {
        return { token, user: null };
    }
};

export default function AuthProvider({ children }) {
    const toast = useToast();
    const [session, setSession] = useState(readSession);

    const login = useCallback((token, user) => {
        const normalized = normalizeUser(user);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(normalized));
        setSession({ token, user: normalized });
    }, []);

    const logout = useCallback(
        (reason) => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setSession({ token: null, user: null });

            if (reason === "expired") {
                toast.info("Your session has expired. Please sign in again.");
            }
        },
        [toast]
    );

    const updateUser = useCallback((patch) => {
        setSession((current) => {
            if (!current.user) return current;

            const user = normalizeUser({ ...current.user, ...patch });
            localStorage.setItem("user", JSON.stringify(user));

            return { ...current, user };
        });
    }, []);

    // The API interceptor fires this when the server answers 401
    useEffect(() => {
        const handleUnauthorized = () => logout("expired");

        window.addEventListener("auth:unauthorized", handleUnauthorized);

        return () =>
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }, [logout]);

    // Log out automatically when the token expires mid-session
    useEffect(() => {
        if (!session.token) return;

        const expiry = getTokenExpiry(session.token);

        if (!expiry) return;

        const delay = Math.min(expiry - Date.now(), 2 ** 31 - 1);
        const timer = setTimeout(() => logout("expired"), Math.max(delay, 0));

        return () => clearTimeout(timer);
    }, [session.token, logout]);

    const value = useMemo(
        () => ({
            user: session.user,
            token: session.token,
            isAuthenticated: Boolean(session.token),
            login,
            logout,
            updateUser
        }),
        [session, login, logout, updateUser]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}
