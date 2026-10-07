import { useEffect } from "react";
import { useAuth } from "./authContext";
import { connectSocket, disconnectSocket } from "../socket/socketClient";

// Opens ONE authenticated Socket.IO connection while a user is signed in and
// closes it on logout. It does not reconnect when the open conversation changes.
export default function SocketProvider({ children }) {
    const { token, logout } = useAuth();

    useEffect(() => {
        if (!token) return;

        connectSocket(token, { onAuthError: () => logout("expired") });

        return () => disconnectSocket();
    }, [token, logout]);

    return children;
}
