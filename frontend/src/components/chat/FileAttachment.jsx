import { useState } from "react";
import {
    Archive,
    Download,
    File,
    FileAudio,
    FileCode,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Presentation
} from "lucide-react";
import { formatFileSize } from "../../utils/format";
import { getFileKind, getFileLabel } from "../../utils/files";
import { optimizeImage } from "../../utils/user";

const KIND_ICONS = {
    pdf: FileText,
    doc: FileText,
    text: FileText,
    sheet: FileSpreadsheet,
    slides: Presentation,
    archive: Archive,
    audio: FileAudio,
    video: FileVideo,
    code: FileCode,
    file: File
};

export function FileCard({ fileUrl, fileName, fileType, fileSize, compact = false }) {
    const kind = getFileKind(fileType, fileName);
    const Icon = KIND_ICONS[kind] || File;

    return (
        <a
            className={`file-card file-card--${kind} ${compact ? "file-card--compact" : ""}`}
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={fileName || undefined}
            title={fileName || "Download file"}
        >
            <span className="file-card__icon">
                <Icon size={compact ? 18 : 22} aria-hidden="true" />
            </span>

            <span className="file-card__info">
                <span className="file-card__name">{fileName || "Attachment"}</span>
                <span className="file-card__meta">
                    {getFileLabel(fileType, fileName)}
                    {fileSize ? ` · ${formatFileSize(fileSize)}` : ""}
                </span>
            </span>

            <span className="file-card__action" aria-hidden="true">
                <Download size={16} />
            </span>
        </a>
    );
}

// Image with a shimmer placeholder, rounded preview and graceful fallback
function ImagePreview({ message, onOpen, onLoad }) {
    const [state, setState] = useState({ url: message.fileUrl, level: 0, loaded: false });

    if (state.url !== message.fileUrl) {
        setState({ url: message.fileUrl, level: 0, loaded: false });
    }

    // level 0: optimised CDN rendition -> 1: original -> 2: give up (file card)
    if (state.level >= 2) {
        return <FileCard {...message} />;
    }

    const src =
        state.level === 0
            ? optimizeImage(message.fileUrl, "c_limit,w_900,f_auto,q_auto")
            : message.fileUrl;

    return (
        <button
            type="button"
            className={`media ${state.loaded ? "is-loaded" : "is-loading"}`}
            onClick={() => onOpen({ url: message.fileUrl, name: message.fileName })}
            aria-label={`Open image ${message.fileName || ""}`}
        >
            <img
                src={src}
                alt={message.fileName || "Shared image"}
                draggable={false}
                onLoad={() => {
                    setState((current) => ({ ...current, loaded: true }));
                    onLoad?.();
                }}
                onError={() =>
                    setState((current) => ({ ...current, level: current.level + 1 }))
                }
            />
        </button>
    );
}

export default function FileAttachment({ message, onOpenImage, onMediaLoad }) {
    if (!message.fileUrl) return null;

    const kind = getFileKind(message.fileType, message.fileName);

    if (kind === "image") {
        return (
            <ImagePreview
                message={message}
                onOpen={onOpenImage}
                onLoad={onMediaLoad}
            />
        );
    }

    return <FileCard {...message} />;
}
