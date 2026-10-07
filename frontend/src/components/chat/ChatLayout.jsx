import { useRef, useState } from "react";
import { useChat } from "../../context/chatContext";
import useMediaQuery from "../../hooks/useMediaQuery";
import ConnectionBanner from "../common/ConnectionBanner";
import Sidebar from "../sidebar/Sidebar";
import ProfilePanel from "../profile/ProfilePanel";
import ProfileModal from "../profile/ProfileModal";
import ChatWindow from "./ChatWindow";
import EmptyChat from "./EmptyChat";
import ImageViewer from "./ImageViewer";

// Sidebar | conversation | profile panel
export default function ChatLayout() {
    const { activeId } = useChat();
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
        </div>
    );
}
