import { useSyncExternalStore } from "react";
import { subscribe, getSocketState } from "../socket/socketClient";

// -> { socket, status }  status: idle | connecting | connected | reconnecting | disconnected
export default function useSocket() {
    return useSyncExternalStore(subscribe, getSocketState, getSocketState);
}
