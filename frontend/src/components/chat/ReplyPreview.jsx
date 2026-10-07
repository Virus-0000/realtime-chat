import { Image as ImageIcon, Paperclip, Pencil, Reply, X } from "lucide-react";
import { describeMessage, getFileKind } from "../../utils/files";

/**
 * Banner above the composer.
 * variant="reply" -> "Replying to Ada"   variant="edit" -> "Editing message"
 */
export default function ReplyPreview({ variant = "reply", name, message, onCancel }) {
    const isEdit = variant === "edit";
    const Icon = isEdit ? Pencil : Reply;
    const hasFile = Boolean(message?.fileUrl);
    const isImage =
        hasFile && getFileKind(message.fileType, message.fileName) === "image";

    return (
        <div className={`reply-preview ${isEdit ? "reply-preview--edit" : ""}`}>
            <Icon size={16} className="reply-preview__icon" aria-hidden="true" />

            <div className="reply-preview__body">
                <span className="reply-preview__title">
                    {isEdit ? "Editing message" : `Replying to ${name}`}
                </span>
                <span className="reply-preview__text">
                    {hasFile &&
                        (isImage ? (
                            <ImageIcon size={13} aria-hidden="true" />
                        ) : (
                            <Paperclip size={13} aria-hidden="true" />
                        ))}
                    {describeMessage(message)}
                </span>
            </div>

            <button
                type="button"
                className="reply-preview__close"
                onClick={onCancel}
                aria-label={isEdit ? "Cancel editing" : "Cancel reply"}
            >
                <X size={15} />
            </button>
        </div>
    );
}
