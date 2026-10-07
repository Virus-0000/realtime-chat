import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./Button";

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/**
 * size: sm | md | lg | full. On phones the dialog becomes a bottom sheet.
 */
export default function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = "md",
    hideHeader = false,
    className = ""
}) {
    const dialogRef = useRef(null);
    const titleId = useId();

    useEffect(() => {
        if (!open) return;

        const previouslyFocused = document.activeElement;
        const dialog = dialogRef.current;

        // Focus the first marked field, otherwise the dialog itself
        (dialog.querySelector("[data-autofocus]") || dialog).focus();

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
                return;
            }

            if (event.key !== "Tab") return;

            const focusable = [...dialog.querySelectorAll(FOCUSABLE)];

            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.classList.add("modal-open");

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.classList.remove("modal-open");
            previouslyFocused?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className="modal-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                ref={dialogRef}
                className={`modal modal--${size} ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
            >
                {!hideHeader && (
                    <header className="modal__header">
                        <div>
                            <h2 id={titleId} className="modal__title">
                                {title}
                            </h2>
                            {description && (
                                <p className="modal__description">
                                    {description}
                                </p>
                            )}
                        </div>
                        <IconButton
                            icon={X}
                            label="Close"
                            size="sm"
                            onClick={onClose}
                        />
                    </header>
                )}

                <div className="modal__body">{children}</div>

                {footer && <footer className="modal__footer">{footer}</footer>}
            </div>
        </div>,
        document.body
    );
}
