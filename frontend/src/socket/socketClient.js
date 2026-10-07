import { io } from "socket.io-client";
import { API_ORIGIN } from "../api/axios";

// ONE persistent Socket.IO connection for the whole authenticated session.
// It lives outside React so changing conversations never reconnects.

let socket = null;
let state = { socket: null, status: "idle" };
const listeners = new Set();

const setState = (patch) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
};

export const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const getSocketState = () => state;

const isAuthError = (error) =>
    /token|authentication|user not found/i.test(error?.message || "");

export const connectSocket = (token, { onAuthError } = {}) => {
    disconnectSocket();

    socket = io(API_ORIGIN, {
        auth: { token },
        reconnectionDelayMax: 5000
    });

    const current = socket;

    current.on("connect", () => setState({ status: "connected" }));
    current.on("disconnect", () => setState({ status: "disconnected" }));

    current.on("connect_error", (error) => {
        if (isAuthError(error)) {
            current.disconnect();
            onAuthError?.();
            return;
        }

        setState({ status: "disconnected" });
    });

    current.io.on("reconnect_attempt", () =>
        setState({ status: "reconnecting" })
    );

    setState({ socket: current, status: "connecting" });
};

export const disconnectSocket = () => {
    if (socket) {
        socket.removeAllListeners();
        socket.io.removeAllListeners();
        socket.disconnect();
        socket = null;
    }

    if (state.socket) {
        setState({ socket: null, status: "idle" });
    }
};
