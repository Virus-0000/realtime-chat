import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };

export default function ToastViewport({ toasts, onDismiss }) {
    return (
        <div className="toast-viewport" aria-live="polite" aria-atomic="false">
            {toasts.map((toast) => {
                const Icon = ICONS[toast.type] || Info;

                return (
                    <div
                        key={toast.id}
                        className={`toast toast--${toast.type}`}
                        role={toast.type === "error" ? "alert" : "status"}
                    >
                        <Icon size={18} className="toast__icon" aria-hidden="true" />

                        <div className="toast__content">
                            {toast.title && (
                                <strong className="toast__title">{toast.title}</strong>
                            )}
                            <span>{toast.message}</span>
                        </div>

                        <button
                            type="button"
                            className="toast__close"
                            aria-label="Dismiss notification"
                            onClick={() => onDismiss(toast.id)}
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
