import { Check, CheckCheck, FileText, Image as ImageIcon } from "lucide-react";
import Avatar from "../common/Avatar";
import { useChat } from "../../context/chatContext";
import { formatListTime } from "../../utils/format";
import { getFileKind } from "../../utils/files";
import { idOf } from "../../utils/user";

function Preview({ conversation, otherUser }) {
    const { currentUser, isTyping } = useChat();
    const last = conversation.lastMessage;

    if (otherUser && isTyping(otherUser._id)) {
        return <span className="conv__typing">typing…</span>;
    }

    if (!last) {
        return <span className="conv__empty">No messages yet</span>;
    }

    const mine = idOf(last.sender) === String(currentUser?._id);
    const kind = last.fileUrl ? getFileKind(last.fileType, last.fileName) : null;
    const text =
        last.text ||
        (kind === "image" ? "Photo" : last.fileName || "File");

    return (
        <>
            {mine &&
                (last.isRead ? (
                    <CheckCheck size={15} className="conv__tick conv__tick--read" aria-label="Read" />
                ) : last.isDelivered ? (
                    <CheckCheck size={15} className="conv__tick" aria-label="Delivered" />
                ) : (
                    <Check size={15} className="conv__tick" aria-label="Sent" />
                ))}

            {kind &&
                (kind === "image" ? (
                    <ImageIcon size={14} className="conv__kind" aria-hidden="true" />
                ) : (
                    <FileText size={14} className="conv__kind" aria-hidden="true" />
                ))}

            <span className="conv__text">
                {mine && !kind ? <span className="conv__you">You: </span> : null}
                {text}
            </span>
        </>
    );
}

export default function ConversationItem({ conversation, active, onSelect }) {
    const { getOtherUser, isOnline, isTyping } = useChat();

    const otherUser = getOtherUser(conversation);
    const unread = conversation.unreadCount || 0;
    const online = isOnline(otherUser);
    const time = formatListTime(
        conversation.lastMessage?.createdAt || conversation.updatedAt
    );

    return (
        <button
            type="button"
            className={`conv ${active ? "is-active" : ""} ${unread ? "has-unread" : ""}`}
            onClick={() => onSelect(conversation._id)}
            aria-current={active ? "true" : undefined}
        >
            <Avatar user={otherUser} size="lg" online={online} />

            <span className="conv__body">
                <span className="conv__top">
                    <span className="conv__name">{otherUser?.name || "Unknown user"}</span>
                    <time className="conv__time">{time}</time>
                </span>

                <span className="conv__bottom">
                    <span
                        className={`conv__preview ${
                            otherUser && isTyping(otherUser._id) ? "is-typing" : ""
                        }`}
                    >
                        <Preview conversation={conversation} otherUser={otherUser} />
                    </span>

                    {unread > 0 && (
                        <span className="badge" aria-label={`${unread} unread messages`}>
                            {unread > 99 ? "99+" : unread}
                        </span>
                    )}
                </span>
            </span>
        </button>
    );
}
