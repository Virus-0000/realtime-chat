import { RefreshCw, WifiOff } from "lucide-react";
import useSocket from "../../hooks/useSocket";

// Shown while the realtime connection is down.
export default function ConnectionBanner() {
    const { socket, status } = useSocket();

    if (status !== "disconnected" && status !== "reconnecting") return null;

    const reconnecting = status === "reconnecting";

    return (
        <div className="connection-banner" role="alert">
            <WifiOff size={16} aria-hidden="true" />
            <span>
                {reconnecting
                    ? "Reconnecting to the server…"
                    : "Connection lost. Messages can't be sent right now."}
            </span>
            {!reconnecting && (
                <button type="button" onClick={() => socket?.connect()}>
                    <RefreshCw size={13} aria-hidden="true" />
                    Retry
                </button>
            )}
        </div>
    );
}
