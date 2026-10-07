import { MessageSquarePlus, ServerCrash } from "lucide-react";
import { useChat } from "../../context/chatContext";
import useTick from "../../hooks/useTick";
import ConversationItem from "./ConversationItem";
import EmptyState from "../common/EmptyState";
import Button from "../common/Button";
import { Skeleton } from "../common/Loader";

function ConversationSkeleton() {
    return (
        <div className="conv-skeleton" aria-hidden="true">
            <Skeleton width={48} height={48} radius={999} />
            <div className="conv-skeleton__lines">
                <Skeleton width="55%" height={13} />
                <Skeleton width="85%" height={11} />
            </div>
        </div>
    );
}

export default function ConversationList({ onStartNew }) {
    const {
        conversations,
        conversationsStatus,
        reloadConversations,
        activeId,
        openConversation
    } = useChat();

    useTick(); // keeps relative timestamps fresh

    if (conversationsStatus === "loading") {
        return (
            <div className="conv-list" aria-busy="true">
                {Array.from({ length: 7 }, (_, index) => (
                    <ConversationSkeleton key={index} />
                ))}
            </div>
        );
    }

    if (conversationsStatus === "error") {
        return (
            <EmptyState
                icon={ServerCrash}
                tone="danger"
                title="Couldn't load conversations"
                description="The server didn't respond. Check that the backend is running and try again."
                action={
                    <Button variant="secondary" onClick={reloadConversations}>
                        Try again
                    </Button>
                }
            />
        );
    }

    if (conversations.length === 0) {
        return (
            <EmptyState
                icon={MessageSquarePlus}
                title="No conversations yet"
                description="Search for a teammate or friend by name or email to start your first conversation."
                action={
                    <Button icon={MessageSquarePlus} onClick={onStartNew}>
                        Find people
                    </Button>
                }
            />
        );
    }

    return (
        <nav className="conv-list" aria-label="Conversations">
            {conversations.map((conversation) => (
                <ConversationItem
                    key={conversation._id}
                    conversation={conversation}
                    active={conversation._id === activeId}
                    onSelect={openConversation}
                />
            ))}
        </nav>
    );
}
