import { memo, useRef } from "react";
import {
    Check,
    CheckCheck,
    CircleAlert,
    Clock,
    Ellipsis,
    Image as ImageIcon,
    Paperclip,
    Reply
} from "lucide-react";
import Avatar from "../common/Avatar";
import FileAttachment from "./FileAttachment";
import MessageContent from "./MessageContent";
import { formatFullDateTime, formatTime } from "../../utils/format";
import { describeMessage, getFileKind } from "../../utils/files";
import { idOf } from "../../utils/user";
import { isEmojiOnly } from "../../utils/text";

function Ticks({ message }) {
    if (message.failed) {
        return <CircleAlert size={14} className="tick tick--failed" aria-label="Failed to send" />;
    }

    if (message.pending) {
        return <Clock size={13} className="tick" aria-label="Sending" />;
    }

    if (message.isRead) {
        return <CheckCheck size={15} className="tick tick--read" aria-label="Read" />;
    }

    if (message.isDelivered) {
        return <CheckCheck size={15} className="tick" aria-label="Delivered" />;
    }

    return <Check size={15} className="tick" aria-label="Sent" />;
}

function ReplyQuote({ replyTo, isOwn, authorName, onJump }) {
    const kind = replyTo.fileUrl
        ? getFileKind(replyTo.fileType, replyTo.fileName)
        : null;

    return (
        <button
            type="button"
            className={`quote ${isOwn ? "quote--own" : ""}`}
            onClick={() => onJump(replyTo._id)}
            aria-label={`Go to message from ${authorName}`}
        >
            <span className="quote__author">{authorName}</span>
            <span className="quote__text">
                {kind &&
                    (kind === "image" ? (
                        <ImageIcon size={12} aria-hidden="true" />
                    ) : (
                        <Paperclip size={12} aria-hidden="true" />
                    ))}
                {describeMessage(replyTo)}
            </span>
        </button>
    );
}

const LONG_PRESS_MS = 450;

function MessageBubble({
    message,
    isOwn,
    first,
    last,
    senderUser,
    currentUserId,
    otherName,
    highlight,
    isActiveMatch,
    onReply,
    onOpenMenu,
    onOpenImage,
    onMediaLoad,
    onJumpTo,
    onRetry,
    onDiscard
}) {
    const pressTimer = useRef(null);

    const hasFile = Boolean(message.fileUrl);
    const isImage =
        hasFile && getFileKind(message.fileType, message.fileName) === "image";
    const hasText = Boolean(message.text);
    const emojiOnly =
        hasText && !hasFile && !message.replyTo && isEmojiOnly(message.text);
    const mediaOnly = isImage && !hasText && !message.replyTo;

    const classes = [
        "msg",
        isOwn ? "msg--own" : "msg--other",
        first ? "msg--first" : "",
        last ? "msg--last" : "",
        emojiOnly ? "msg--emoji" : "",
        mediaOnly ? "msg--media-only" : "",
        message.pending ? "is-pending" : "",
        message.failed ? "is-failed" : "",
        isActiveMatch ? "is-match" : ""
    ]
        .filter(Boolean)
        .join(" ");

    const replyAuthor = message.replyTo
        ? idOf(message.replyTo.sender) === String(currentUserId)
            ? "You"
            : otherName
        : "";

    const openMenuAt = (event) => {
        if (message.pending || message.failed) return;
        event.preventDefault();
        onOpenMenu(message, { x: event.clientX, y: event.clientY, align: "left" });
    };

    const openMenuFromButton = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();

        onOpenMenu(message, {
            x: isOwn ? rect.right : rect.left,
            y: rect.bottom + 6,
            align: isOwn ? "right" : "left"
        });
    };

    const cancelPress = () => clearTimeout(pressTimer.current);

    const startPress = (event) => {
        if (message.pending || message.failed) return;

        const touch = event.touches[0];

        pressTimer.current = setTimeout(() => {
            navigator.vibrate?.(8);
            onOpenMenu(message, { x: touch.clientX, y: touch.clientY, align: "left" });
        }, LONG_PRESS_MS);
    };

    return (
        <div id={`message-${message._id}`} className={classes}>
            {!isOwn && (
                <div className="msg__gutter">
                    {last && <Avatar user={senderUser} size="sm" />}
                </div>
            )}

            <div className="msg__column">
                <div
                    className="msg__bubble"
                    onContextMenu={openMenuAt}
                    onTouchStart={startPress}
                    onTouchEnd={cancelPress}
                    onTouchMove={cancelPress}
                    onTouchCancel={cancelPress}
                >
                    {message.replyTo && (
                        <ReplyQuote
                            replyTo={message.replyTo}
                            isOwn={isOwn}
                            authorName={replyAuthor}
                            onJump={onJumpTo}
                        />
                    )}

                    {hasFile && (
                        <FileAttachment
                            message={message}
                            onOpenImage={onOpenImage}
                            onMediaLoad={onMediaLoad}
                        />
                    )}

                    {hasText && (
                        <p className="msg__text">
                            <MessageContent text={message.text} highlight={highlight} />
                        </p>
                    )}

                    <span
                        className="msg__meta"
                        title={formatFullDateTime(message.createdAt)}
                    >
                        {message.isEdited && <span className="msg__edited">edited</span>}
                        <time dateTime={message.createdAt}>
                            {formatTime(message.createdAt)}
                        </time>
                        {isOwn && <Ticks message={message} />}
                    </span>
                </div>

                {message.failed && (
                    <div className="msg__failed" role="alert">
                        <CircleAlert size={13} aria-hidden="true" />
                        Not sent
                        <button type="button" onClick={() => onRetry(message.clientId)}>
                            Retry
                        </button>
                        <button type="button" onClick={() => onDiscard(message.clientId)}>
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {!message.pending && !message.failed && (
                <div className="msg__actions">
                    <button
                        type="button"
                        className="msg__action"
                        onClick={() => onReply(message)}
                        aria-label="Reply"
                        title="Reply"
                    >
                        <Reply size={16} />
                    </button>
                    <button
                        type="button"
                        className="msg__action"
                        onClick={openMenuFromButton}
                        aria-label="More actions"
                        title="More"
                        aria-haspopup="menu"
                    >
                        <Ellipsis size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default memo(MessageBubble);
