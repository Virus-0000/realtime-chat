import { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/chatContext";
import useMediaQuery from "../../hooks/useMediaQuery";
import ConnectionBanner from "../common/ConnectionBanner";
import Sidebar from "../sidebar/Sidebar";
import ProfilePanel from "../profile/ProfilePanel";
import ProfileModal from "../profile/ProfileModal";
import ChatWindow from "./ChatWindow";
import EmptyChat from "./EmptyChat";
import ImageViewer from "./ImageViewer";
import CallModal from "./CallModal";
import { PhoneOff } from "lucide-react";

// Sidebar | conversation | profile panel
export default function ChatLayout() {
    const {
    activeId,
    startCall,
    call,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera
} = useChat();
    const searchInputRef = useRef(null);

    // Wide screens: the panel is a column (open by default on large monitors).
    // Narrower screens: it is a drawer that is always closed until requested.
    // They are tracked separately so resizing never pops a drawer over the chat.
    const isWide = useMediaQuery("(min-width: 1280px)");
    const [widePanel, setWidePanel] = useState(() => window.innerWidth >= 1440);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const panelOpen = isWide ? widePanel : drawerOpen;
    const setPanelOpen = isWide ? setWidePanel : setDrawerOpen;
    const [profileOpen, setProfileOpen] = useState(false);
    const [viewerImage, setViewerImage] = useState(null);
    const [callMinimized, setCallMinimized] = useState(false);
    const [callPosition, setCallPosition] = useState(null);
    useEffect(() => {
    const handleResize = () => {
        setCallPosition((previous) => {
            if (!previous) return null;

            const card = document.querySelector(".minimized-call");
            if (!card) return null;

            return {
                x: Math.max(
                    0,
                    Math.min(previous.x, window.innerWidth - card.offsetWidth)
                ),
                y: Math.max(
                    0,
                    Math.min(previous.y, window.innerHeight - card.offsetHeight)
                )
            };
        });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
}, []);
const callDragRef = useRef(null);
    const [callDuration, setCallDuration] = useState(0);

useEffect(() => {
    if (call?.status !== "connected") {
        setCallDuration(0);
        return;
    }

    const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
}, [call?.status]);

    useEffect(() => {
    if (!call) {
        setCallMinimized(false);
    }
}, [call]);
const handleCallDragStart = (event) => {
    if (event.button !== undefined && event.button !== 0) return;

    const card = event.currentTarget.closest(".minimized-call");
    const rect = card.getBoundingClientRect();

    callDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        moved: false
    };

    event.currentTarget.setPointerCapture(event.pointerId);
};

const handleCallDragMove = (event) => {
    const drag = callDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        drag.moved = true;
    }

    if (!drag.moved) return;

    const card = document.querySelector(".minimized-call");
    if (!card) return;

    setCallPosition({
        x: Math.max(
            0,
            Math.min(window.innerWidth - card.offsetWidth, drag.startLeft + deltaX)
        ),
        y: Math.max(
            0,
            Math.min(window.innerHeight - card.offsetHeight, drag.startTop + deltaY)
        )
    });
};

const handleCallDragEnd = (event) => {
    if (callDragRef.current?.pointerId !== event.pointerId) return;

    const wasMoved = callDragRef.current.moved;
    callDragRef.current = null;

    if (wasMoved) {
        // Prevent the click following a drag from restoring the call.
        callDragRef.current = { moved: true };
    }
};
    const hasConversation = Boolean(activeId);

    return (
        <div className="app-shell" data-view={hasConversation ? "chat" : "list"}>
            <ConnectionBanner />

            <Sidebar
                searchInputRef={searchInputRef}
                onOpenProfile={() => setProfileOpen(true)}
            />

            <main className="chat-main">
                {hasConversation ? (
                 <ChatWindow
    key={activeId}
    panelOpen={panelOpen}
    onTogglePanel={() => setPanelOpen((open) => !open)}
    onOpenImage={setViewerImage}
   onStartCall={startCall}
/>
                ) : (
                    <EmptyChat onStartNew={() => searchInputRef.current?.focus()} />
                )}
            </main>

            <ProfilePanel
                open={panelOpen && hasConversation}
                onClose={() => setPanelOpen(false)}
                onOpenImage={setViewerImage}
            />

            <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />

            <ImageViewer image={viewerImage} onClose={() => setViewerImage(null)} />
                <CallModal
open={Boolean(call) && !callMinimized}
    callType={call?.type}
    callStatus={call?.status}
    callDuration={callDuration}
    otherUser={call?.otherUser}
    localStream={localStream}
    remoteStream={remoteStream}
    muted={muted}
    cameraOff={cameraOff}
    onAccept={acceptCall}
    onReject={rejectCall}
    onEnd={endCall}
    onMinimize={() => setCallMinimized(true)}
    onToggleMute={toggleMute}
    onToggleCamera={toggleCamera}
/>

{call && callMinimized && (
    <div
        className="minimized-call"
        onClick={() => {
            if (callDragRef.current?.moved) {
                callDragRef.current = null;
                return;
            }

            setCallMinimized(false);
        }}
        onPointerDown={handleCallDragStart}
        onPointerMove={handleCallDragMove}
        onPointerUp={handleCallDragEnd}
        onPointerCancel={handleCallDragEnd}
        style={{
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            ...(callPosition
                ? {
                      left: `${callPosition.x}px`,
                      top: `${callPosition.y}px`,
                      right: "auto",
                      bottom: "auto"
                  }
                : {})
        }}
    >
        <div
            className="minimized-call__info"
            style={{ cursor: "grab" }}
        >
            <strong>{call.otherUser?.name || "Call"}</strong>

            <span>
                {call.status === "connected"
                    ? `Connected · ${String(Math.floor(callDuration / 60)).padStart(2, "0")}:${String(callDuration % 60).padStart(2, "0")}`
                    : call.status === "ringing"
                      ? "Ringing..."
                      : "Calling..."}
            </span>
        </div>

        <button
            type="button"
            className="call-control call-control--end"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
                event.stopPropagation();
                endCall();
            }}
            title="End call"
        >
            <PhoneOff size={20} />
        </button>
    </div>
)}
        </div>
    );
}
