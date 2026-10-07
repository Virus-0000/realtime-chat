import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, ExternalLink, X } from "lucide-react";
import { IconButton } from "../common/Button";

// Full-screen lightbox for shared images and avatars
export default function ImageViewer({ image, onClose }) {
    useEffect(() => {
        if (!image) return;

        const handleKey = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
            }
        };

        document.addEventListener("keydown", handleKey, true);
        return () => document.removeEventListener("keydown", handleKey, true);
    }, [image, onClose]);

    if (!image) return null;

    return createPortal(
        <div
            className="viewer"
            role="dialog"
            aria-modal="true"
            aria-label={image.name || "Image preview"}
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="viewer__bar">
                <span className="viewer__name">{image.name}</span>

                <div className="viewer__actions">
                    <a
                        className="icon-btn icon-btn--md icon-btn--ghost"
                        href={image.url}
                        download={image.name || true}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Download"
                        title="Download"
                    >
                        <Download size={19} />
                    </a>
                    <a
                        className="icon-btn icon-btn--md icon-btn--ghost"
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open original"
                        title="Open original"
                    >
                        <ExternalLink size={19} />
                    </a>
                    <IconButton icon={X} label="Close" onClick={onClose} />
                </div>
            </div>

            <img className="viewer__image" src={image.url} alt={image.name || ""} />
        </div>,
        document.body
    );
}
