import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 208;

/**
 * Floating menu positioned at viewport coordinates (x, y).
 * items: [{ key, label, icon, onClick, danger }] or { type: "separator" }
 * align="right" makes x the menu's RIGHT edge; placement="top" opens upward from y.
 */
export default function ContextMenu({
    open,
    x,
    y,
    items,
    onClose,
    align = "left",
    placement = "bottom"
}) {
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;

        const handlePointer = (event) => {
            if (!ref.current?.contains(event.target)) onClose();
        };

        const handleKey = (event) => {
            if (event.key === "Escape") {
                event.stopPropagation();
                onClose();
            }
        };

        document.addEventListener("pointerdown", handlePointer, true);
        document.addEventListener("keydown", handleKey, true);
        window.addEventListener("resize", onClose);
        window.addEventListener("blur", onClose);
        document.addEventListener("scroll", onClose, true);

        ref.current?.querySelector("button")?.focus();

        return () => {
            document.removeEventListener("pointerdown", handlePointer, true);
            document.removeEventListener("keydown", handleKey, true);
            window.removeEventListener("resize", onClose);
            window.removeEventListener("blur", onClose);
            document.removeEventListener("scroll", onClose, true);
        };
    }, [open, onClose]);

    if (!open) return null;

    // Keep the menu inside the viewport
    const height = items.reduce(
        (sum, item) => sum + (item.type === "separator" ? 9 : 38),
        12
    );
    const rawLeft = align === "right" ? x - MENU_WIDTH : x;
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - MENU_WIDTH - 8));
    const rawTop = placement === "top" ? y - height : y;
    const top = Math.max(8, Math.min(rawTop, window.innerHeight - height - 8));

    return createPortal(
        <div
            ref={ref}
            className="context-menu"
            role="menu"
            style={{ left, top, width: MENU_WIDTH }}
        >
            {items.map((item, index) =>
                item.type === "separator" ? (
                    <div key={`sep-${index}`} className="context-menu__separator" role="separator" />
                ) : (
                    <button
                        key={item.key}
                        type="button"
                        role="menuitem"
                        className={`context-menu__item ${item.danger ? "is-danger" : ""}`}
                        onClick={() => {
                            onClose();
                            item.onClick?.();
                        }}
                    >
                        {item.icon && <item.icon size={16} aria-hidden="true" />}
                        <span>{item.label}</span>
                    </button>
                )
            )}
        </div>,
        document.body
    );
}
