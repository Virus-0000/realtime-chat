import { useMemo, useState } from "react";
import { Paperclip } from "lucide-react";
import { useChat } from "../../context/chatContext";
import { useToast } from "../../context/toastContext";
import { describeMessage, validateAttachment } from "../../utils/files";
import Button from "../common/Button";
import Modal from "../common/Modal";
import ChatHeader from "./ChatHeader";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";
import MessageSearchBar from "./MessageSearchBar";

// The open conversation. Rendered with key={conversationId}, so all local
// state (search, attachment, drag state) resets when switching chats.
export default function ChatWindow({ panelOpen, onTogglePanel, onOpenImage }) {
    const { closeConversation, messages, deleteMessage } = useChat();
    const toast = useToast();

    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [cursor, setCursor] = useState(0); // 0 = most recent match
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const term = query.trim().toLowerCase();

    const matches = useMemo(
        () =>
            term
                ? messages
                      .filter((message) => message.text?.toLowerCase().includes(term))
                      .map((message) => message._id)
                : [],
        [messages, term]
    );

    const safeCursor = Math.min(cursor, Math.max(matches.length - 1, 0));
    const activeMatchId = matches.length
        ? matches[matches.length - 1 - safeCursor]
        : null;

    const closeSearch = () => {
        setSearchOpen(false);
        setQuery("");
        setCursor(0);
    };

    const hasFiles = (event) => [...(event.dataTransfer?.types || [])].includes("Files");

    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);

        const dropped = event.dataTransfer.files?.[0];

        if (!dropped) return;

        const problem = validateAttachment(dropped);

        if (problem) toast.error(problem);
        else setFile(dropped);
    };

    const confirmDelete = () => {
        deleteMessage(deleteTarget._id);
        setDeleteTarget(null);
    };

    return (
        <section
            className="chat-window"
            onDragEnter={(event) => hasFiles(event) && setDragging(true)}
            onDragOver={(event) => hasFiles(event) && event.preventDefault()}
            onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
            }}
            onDrop={handleDrop}
        >
            <ChatHeader
                onBack={closeConversation}
                panelOpen={panelOpen}
                onTogglePanel={onTogglePanel}
                searchOpen={searchOpen}
                onToggleSearch={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            />

            {searchOpen && (
                <MessageSearchBar
                    query={query}
                    onQueryChange={(value) => {
                        setQuery(value);
                        setCursor(0);
                    }}
                    matchCount={matches.length}
                    position={matches.length ? matches.length - safeCursor : 0}
                    onOlder={() => setCursor(Math.min(safeCursor + 1, matches.length - 1))}
                    onNewer={() => setCursor(Math.max(safeCursor - 1, 0))}
                    onClose={closeSearch}
                />
            )}

            <div className="chat-window__body">
                <MessageList
                    searchQuery={searchOpen ? query.trim() : ""}
                    activeMatchId={searchOpen ? activeMatchId : null}
                    onOpenImage={onOpenImage}
                    onRequestDelete={setDeleteTarget}
                />

                {dragging && (
                    <div className="drop-overlay">
                        <Paperclip size={28} aria-hidden="true" />
                        <strong>Drop to attach</strong>
                        <span>Files up to 10 MB</span>
                    </div>
                )}
            </div>

            <MessageComposer file={file} onFileChange={setFile} />

            <Modal
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                size="sm"
                title="Delete message?"
                description="This removes the message for everyone in the conversation. It can't be undone."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} data-autofocus>
                            Delete
                        </Button>
                    </>
                }
            >
                {deleteTarget && (
                    <blockquote className="delete-preview">
                        {describeMessage(deleteTarget)}
                    </blockquote>
                )}
            </Modal>
        </section>
    );
}
