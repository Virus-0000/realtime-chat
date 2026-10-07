import {
    lazy,
    Suspense,
    useEffect,
    useLayoutEffect,
    useRef,
    useState
} from "react";
import {
    Paperclip,
    Check,
    FileText,
    SendHorizontal,
    Smile,
    X
} from "lucide-react";
import { useChat } from "../../context/chatContext";
import { useTheme } from "../../context/themeContext";
import { useToast } from "../../context/toastContext";
import { formatFileSize } from "../../utils/format";
import { getFileKind, validateAttachment } from "../../utils/files";
import { idOf } from "../../utils/user";
import { IconButton } from "../common/Button";
import { Spinner } from "../common/Loader";
import ReplyPreview from "./ReplyPreview";

// The emoji picker is large - only download it when first opened
const EmojiPicker = lazy(() => import("emoji-picker-react"));

const MAX_HEIGHT = 168;

// Unsent text per conversation (survives switching chats within the session)
const drafts = new Map();

function FileChip({ file, progress, onRemove }) {
    const isImage = getFileKind(file.type, file.name) === "image";
    const uploading = progress !== null;

    // Object URL for the thumbnail; released when the chip goes away
    const [previewUrl] = useState(() =>
        isImage ? URL.createObjectURL(file) : null
    );

    useEffect(
        () => () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        },
        [previewUrl]
    );

    return (
        <div className={`file-chip ${uploading ? "is-uploading" : ""}`}>
            <span className="file-chip__thumb">
                {previewUrl ? (
                    <img src={previewUrl} alt="" />
                ) : (
                    <FileText size={20} aria-hidden="true" />
                )}
            </span>

            <span className="file-chip__info">
                <span className="file-chip__name">{file.name}</span>
                <span className="file-chip__meta">
                    {uploading
                        ? `Uploading… ${progress}%`
                        : formatFileSize(file.size)}
                </span>
            </span>

            {!uploading && (
                <button
                    type="button"
                    className="file-chip__remove"
                    onClick={onRemove}
                    aria-label="Remove attachment"
                >
                    <X size={15} />
                </button>
            )}

            {uploading && (
                <span
                    className="file-chip__progress"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            )}
        </div>
    );
}

function Composer({ conversationId, editing, file, onFileChange }) {
    const {
        sendMessage,
        replyTo,
        cancelReply,
        cancelEditing,
        editMessage,
        notifyTyping,
        stopTyping,
        otherUser,
        currentUser
    } = useChat();
    const { theme } = useTheme();
    const toast = useToast();

    const [text, setText] = useState(
        () => editing?.text ?? drafts.get(conversationId) ?? ""
    );
    const [progress, setProgress] = useState(null); // null | 0-100
    const [emojiOpen, setEmojiOpen] = useState(false);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const pickerRef = useRef(null);
    const emojiButtonRef = useRef(null);

    const isEditing = Boolean(editing);
    const uploading = progress !== null;
    const canSend = isEditing
        ? text.trim() !== "" && text.trim() !== editing.text
        : (text.trim() !== "" || Boolean(file)) && !uploading;

    // Grow the textarea with its content
    const resize = () => {
        const element = textareaRef.current;

        if (!element) return;

        element.style.height = "auto";
        element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
    };

    useLayoutEffect(resize, [text]);

    // Focus when replying / editing starts, and on mount
    useEffect(() => {
        const element = textareaRef.current;

        if (!element) return;

        // On touch devices don't summon the keyboard just for opening a chat;
        // do focus when the user starts a reply or an edit.
        const isTouch = window.matchMedia("(pointer: coarse)").matches;

        if (isTouch && !replyTo && !editing) return;

        element.focus({ preventScroll: true });

        const end = element.value.length;
        element.setSelectionRange(end, end);
    }, [replyTo, editing]);

    // Close the emoji picker on outside click / Escape
    useEffect(() => {
        if (!emojiOpen) return;

        const handlePointer = (event) => {
            if (
                !pickerRef.current?.contains(event.target) &&
                !emojiButtonRef.current?.contains(event.target)
            ) {
                setEmojiOpen(false);
            }
        };

        const handleKey = (event) => {
            if (event.key === "Escape") {
                setEmojiOpen(false);
                textareaRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", handlePointer);
        document.addEventListener("keydown", handleKey);

        return () => {
            document.removeEventListener("pointerdown", handlePointer);
            document.removeEventListener("keydown", handleKey);
        };
    }, [emojiOpen]);

    const handleChange = (event) => {
        const value = event.target.value;

        setText(value);

        if (isEditing) return;

        if (value) drafts.set(conversationId, value);
        else drafts.delete(conversationId);

        if (value.trim()) notifyTyping();
        else stopTyping();
    };

    const attach = (selected) => {
        const problem = validateAttachment(selected);

        if (problem) {
            toast.error(problem);
            return;
        }

        onFileChange(selected);
        textareaRef.current?.focus();
    };

    const handleFileInput = (event) => {
        const selected = event.target.files?.[0];

        event.target.value = "";

        if (selected) attach(selected);
    };

    const handlePaste = (event) => {
        const pasted = [...(event.clipboardData?.files || [])][0];

        if (pasted) {
            event.preventDefault();
            attach(pasted);
        }
    };

    const insertEmoji = ({ emoji }) => {
        const element = textareaRef.current;
        const start = element?.selectionStart ?? text.length;
        const end = element?.selectionEnd ?? text.length;
        const next = text.slice(0, start) + emoji + text.slice(end);

        setText(next);

        if (!isEditing) drafts.set(conversationId, next);

        requestAnimationFrame(() => {
            element?.focus();
            element?.setSelectionRange(start + emoji.length, start + emoji.length);
        });
    };

    const submit = async () => {
        if (!canSend) return;

        if (isEditing) {
            editMessage(editing._id, text);
            return;
        }

        if (file) setProgress(0);

        const sent = await sendMessage({ text, file, onProgress: setProgress });

        setProgress(null);

        if (sent) {
            setText("");
            drafts.delete(conversationId);
            onFileChange(null);
            setEmojiOpen(false);
        }
    };

    const handleKeyDown = (event) => {
        // Enter sends, Shift+Enter adds a new line (ignored while an IME is composing)
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
            return;
        }

        if (event.key === "Escape") {
            if (isEditing) cancelEditing();
            else if (replyTo) cancelReply();
        }
    };

    const replyAuthor =
        replyTo && idOf(replyTo.sender) === String(currentUser?._id)
            ? "yourself"
            : otherUser?.name;

    return (
        <div className="composer">
            <div className="composer__box">
                {isEditing && (
                    <ReplyPreview variant="edit" message={editing} onCancel={cancelEditing} />
                )}

                {!isEditing && replyTo && (
                    <ReplyPreview
                        name={replyAuthor}
                        message={replyTo}
                        onCancel={cancelReply}
                    />
                )}

                {file && !isEditing && (
                    <FileChip
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        file={file}
                        progress={progress}
                        onRemove={() => onFileChange(null)}
                    />
                )}

                <div className="composer__row">
                    {!isEditing && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                onChange={handleFileInput}
                                tabIndex={-1}
                            />
                            <IconButton
                                icon={Paperclip}
                                label="Attach a file"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            />
                        </>
                    )}

                    <textarea
                        ref={textareaRef}
                        className="composer__input"
                        rows={1}
                        placeholder={
                            isEditing
                                ? "Edit your message"
                                : file
                                ? "Add a caption (optional)"
                                : `Message ${otherUser?.name?.split(" ")[0] || ""}`.trim()
                        }
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onBlur={stopTyping}
                        aria-label="Message"
                        disabled={uploading}
                    />

                    <IconButton
                        ref={emojiButtonRef}
                        icon={Smile}
                        label="Add emoji"
                        active={emojiOpen}
                        onClick={() => setEmojiOpen((open) => !open)}
                    />

                    <button
                        type="button"
                        className={`send-btn ${isEditing ? "send-btn--edit" : ""}`}
                        onClick={submit}
                        disabled={!canSend}
                        aria-label={isEditing ? "Save changes" : "Send message"}
                        title={isEditing ? "Save changes (Enter)" : "Send (Enter)"}
                    >
                        {uploading ? (
                            <Spinner size={18} />
                        ) : isEditing ? (
                            <Check size={19} />
                        ) : (
                            <SendHorizontal size={19} />
                        )}
                    </button>
                </div>
            </div>

            <p className="composer__hint">
                <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
            </p>

            {emojiOpen && (
                <div ref={pickerRef} className="emoji-popover">
                    <Suspense
                        fallback={
                            <div className="emoji-popover__loading">
                                <Spinner />
                            </div>
                        }
                    >
                        <EmojiPicker
                            theme={theme}
                            onEmojiClick={insertEmoji}
                            lazyLoadEmojis
                            skinTonesDisabled
                            previewConfig={{ showPreview: false }}
                            width="100%"
                            height={380}
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
}

// Remount when switching between "write" and "edit" so the textarea starts
// with the right content without syncing state in effects.
export default function MessageComposer({ file, onFileChange }) {
    const { activeId, editing } = useChat();

    return (
        <Composer
            key={editing?._id || "compose"}
            conversationId={activeId}
            editing={editing}
            file={file}
            onFileChange={onFileChange}
        />
    );
}
