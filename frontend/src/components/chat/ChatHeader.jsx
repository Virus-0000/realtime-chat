import {
    ArrowLeft,
    PanelRight,
    Search,
    Phone,
    Video
} from "lucide-react";
import { useChat } from "../../context/chatContext";
import useTick from "../../hooks/useTick";
import { formatLastSeen } from "../../utils/format";
import Avatar from "../common/Avatar";
import { IconButton } from "../common/Button";
import TypingIndicator from "./TypingIndicator";

export function PresenceStatus({ user }) {
    const { isOnline, getLastSeen, isTyping } = useChat();

    if (!user) return null;

    if (isTyping(user._id)) {
        return (
            <span className="status status--typing">
                typing
                <TypingIndicator />
            </span>
        );
    }

    if (isOnline(user)) {
        return (
            <span className="status status--online">
                <i aria-hidden="true" />
                Online
            </span>
        );
    }

return (
    <span className="status status--last-seen">
        <span className="status__marquee">
            {formatLastSeen(getLastSeen(user))}
        </span>
    </span>
);
}

export default function ChatHeader({
    onBack,
    panelOpen,
    onTogglePanel,
    searchOpen,
    onToggleSearch,
    onStartCall
}) {
    const { otherUser, isOnline } = useChat();

    useTick(); // refresh "Last seen" labels

    return (
        <header className="chat-header">
            <IconButton
                icon={ArrowLeft}
                label="Back to conversations"
                className="chat-header__back"
                onClick={onBack}
            />

            <button
                type="button"
                className="chat-header__user"
                onClick={onTogglePanel}
                aria-label={`View ${otherUser?.name || "contact"}'s profile`}
            >
                <Avatar user={otherUser} size="lg" online={isOnline(otherUser)} />

                <span className="chat-header__text">
                    <span className="chat-header__name">
                        {otherUser?.name || "Unknown user"}
                    </span>
                    <PresenceStatus user={otherUser} />
                </span>
            </button>
<IconButton
    icon={Phone}
    label="Start voice call"
    onClick={() => onStartCall?.("audio")}
/>

<IconButton
    icon={Video}
    label="Start video call"
    onClick={() => onStartCall?.("video")}
/>
            <div className="chat-header__actions">
                <IconButton
                    icon={Search}
                    label="Search in conversation"
                    active={searchOpen}
                    onClick={onToggleSearch}
                />
                <IconButton
                    icon={PanelRight}
                    label={panelOpen ? "Hide profile panel" : "Show profile panel"}
                    active={panelOpen}
                    onClick={onTogglePanel}
                />
            </div>
        </header>
    );
}
