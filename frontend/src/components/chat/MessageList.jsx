import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react";
import {
    ArrowDown,
    Copy,
    ExternalLink,
    Hand,
    MessageCircleWarning,
    Pencil,
    Reply,
    Trash2
} from "lucide-react";
import { useChat } from "../../context/chatContext";
import { useToast } from "../../context/toastContext";
import useTick from "../../hooks/useTick";
import { formatDayLabel, isSameDay } from "../../utils/format";
import { idOf } from "../../utils/user";
import Avatar from "../common/Avatar";
import ContextMenu from "../common/ContextMenu";
import EmptyState from "../common/EmptyState";
import Button from "../common/Button";
import { Skeleton } from "../common/Loader";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

const GROUP_WINDOW = 5 * 60 * 1000;

// Flattens messages into date separators + grouped message rows
const buildItems = (messages) => {
    const items = [];

    messages.forEach((message, index) => {
        const previous = messages[index - 1];
        const next = messages[index + 1];

        const sameGroup = (a, b) =>
            a &&
            b &&
            idOf(a.sender) === idOf(b.sender) &&
            isSameDay(a.createdAt, b.createdAt) &&
            Math.abs(new Date(b.createdAt) - new Date(a.createdAt)) < GROUP_WINDOW;

        if (!previous || !isSameDay(previous.createdAt, message.createdAt)) {
            items.push({
                type: "date",
                key: `date-${message._id}`,
                date: message.createdAt
            });
        }

        items.push({
            type: "message",
            key: message.clientId || message._id,
            message,
            first: !sameGroup(previous, message),
            last: !sameGroup(message, next)
        });
    });

    return items;
};

function MessagesSkeleton() {
    const rows = [
        { own: false, width: 220 },
        { own: false, width: 150 },
        { own: true, width: 190 },
        { own: false, width: 260 },
        { own: true, width: 120 },
        { own: true, width: 230 }
    ];

    return (
        <div className="messages__skeleton" aria-busy="true" aria-label="Loading messages">
            {rows.map((row, index) => (
                <div key={index} className={`messages__skeleton-row ${row.own ? "is-own" : ""}`}>
                    <Skeleton width={row.width} height={42} radius={18} />
                </div>
            ))}
        </div>
    );
}

export default function MessageList({
    searchQuery,
    activeMatchId,
    onOpenImage,
    onRequestDelete
}) {
    const {
        messages,
        messagesStatus,
        retryMessages,
        currentUser,
        otherUser,
        isTyping,
        startReply,
        startEditing,
        retryMessage,
        discardMessage
    } = useChat();
    const toast = useToast();

    useTick();

    const scrollRef = useRef(null);
    const nearBottom = useRef(true);
    const initialScrollDone = useRef(false);
    const [showJump, setShowJump] = useState(false);
    const [menu, setMenu] = useState(null);

    const myId = String(currentUser?._id);
    const typing = Boolean(otherUser && isTyping(otherUser._id));
    const items = useMemo(() => buildItems(messages), [messages]);
    const lastMessage = messages[messages.length - 1];

    const scrollToBottom = useCallback((behavior = "smooth") => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior
        });
    }, []);

    // Stay pinned to the bottom for new messages (always for your own,
    // only when already near the bottom for incoming ones).
    useLayoutEffect(() => {
        if (!lastMessage) return;

        const isFirst = !initialScrollDone.current;
        const isMine = idOf(lastMessage.sender) === myId;

        if (isFirst || isMine || nearBottom.current) {
            scrollToBottom(isFirst ? "auto" : "smooth");
            initialScrollDone.current = true;
        }
    }, [lastMessage, typing, myId, scrollToBottom]);

    // Jump to the active search match
    useEffect(() => {
        if (!activeMatchId) return;

        document
            .getElementById(`message-${activeMatchId}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [activeMatchId]);

    const handleScroll = (event) => {
        const element = event.currentTarget;
        const distance =
            element.scrollHeight - element.scrollTop - element.clientHeight;

        nearBottom.current = distance < 140;
        setShowJump(distance > 320);
    };

    // Images change the height after they load
    const handleMediaLoad = useCallback(() => {
        if (nearBottom.current) scrollToBottom("auto");
    }, [scrollToBottom]);

    const jumpTo = useCallback(
        (messageId) => {
            const element = document.getElementById(`message-${messageId}`);

            if (!element) {
                toast.info("That message isn't available anymore");
                return;
            }

            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("is-flash");
            setTimeout(() => element.classList.remove("is-flash"), 1600);
        },
        [toast]
    );

    const openMenu = useCallback(
        (message, position) => setMenu({ message, ...position }),
        []
    );
    const closeMenu = useCallback(() => setMenu(null), []);

    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard");
        } catch {
            toast.error("Couldn't copy to the clipboard");
        }
    };

    const menuItems = (message) => {
        const isOwn = idOf(message.sender) === myId;

        return [
            { key: "reply", label: "Reply", icon: Reply, onClick: () => startReply(message) },
            message.text && {
                key: "copy",
                label: "Copy text",
                icon: Copy,
                onClick: () => copyText(message.text)
            },
            message.fileUrl && {
                key: "open",
                label: "Open file",
                icon: ExternalLink,
                onClick: () => window.open(message.fileUrl, "_blank", "noopener")
            },
            isOwn &&
                message.text && {
                    key: "edit",
                    label: "Edit message",
                    icon: Pencil,
                    onClick: () => startEditing(message)
                },
            isOwn && { type: "separator" },
            isOwn && {
                key: "delete",
                label: "Delete message",
                icon: Trash2,
                danger: true,
                onClick: () => onRequestDelete(message)
            }
        ].filter(Boolean);
    };

    if (messagesStatus === "loading") {
        return (
            <div className="messages">
                <MessagesSkeleton />
            </div>
        );
    }

    if (messagesStatus === "error") {
        return (
            <div className="messages messages--center">
                <EmptyState
                    icon={MessageCircleWarning}
                    tone="danger"
                    title="Couldn't load messages"
                    description="Something went wrong while fetching this conversation."
                    action={
                        <Button variant="secondary" onClick={retryMessages}>
                            Try again
                        </Button>
                    }
                />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="messages messages--center">
                <EmptyState
                    icon={Hand}
                    title={`Say hi to ${otherUser?.name?.split(" ")[0] || "them"}`}
                    description="This is the start of your conversation. Messages are saved so you can pick up anytime."
                />
            </div>
        );
    }

    return (
        <div className="messages-wrap">
            <div
                ref={scrollRef}
                className="messages"
                onScroll={handleScroll}
                role="log"
                aria-live="polite"
                aria-label="Conversation"
            >
                <div className="messages__inner">
                    {items.map((item) =>
                        item.type === "date" ? (
                            <div key={item.key} className="date-sep">
                                <span>{formatDayLabel(item.date)}</span>
                            </div>
                        ) : (
                            <MessageBubble
                                key={item.key}
                                message={item.message}
                                first={item.first}
                                last={item.last}
                                isOwn={idOf(item.message.sender) === myId}
                                senderUser={
                                    idOf(item.message.sender) === myId
                                        ? currentUser
                                        : otherUser
                                }
                                currentUserId={myId}
                                otherName={otherUser?.name}
                                highlight={searchQuery}
                                isActiveMatch={
                                    String(item.message._id) === String(activeMatchId)
                                }
                                onReply={startReply}
                                onOpenMenu={openMenu}
                                onOpenImage={onOpenImage}
                                onMediaLoad={handleMediaLoad}
                                onJumpTo={jumpTo}
                                onRetry={retryMessage}
                                onDiscard={discardMessage}
                            />
                        )
                    )}

                    {typing && (
                        <div className="msg msg--other msg--last msg--typing">
                            <div className="msg__gutter">
                                <Avatar user={otherUser} size="sm" />
                            </div>
                            <div className="msg__column">
                                <div className="msg__bubble">
                                    <TypingIndicator />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button
                type="button"
                className={`jump-btn ${showJump ? "is-visible" : ""}`}
                onClick={() => scrollToBottom("smooth")}
                aria-label="Scroll to latest message"
                tabIndex={showJump ? 0 : -1}
            >
                <ArrowDown size={18} />
            </button>

            <ContextMenu
                open={Boolean(menu)}
                x={menu?.x ?? 0}
                y={menu?.y ?? 0}
                align={menu?.align}
                items={menu ? menuItems(menu.message) : []}
                onClose={closeMenu}
            />
        </div>
    );
}
