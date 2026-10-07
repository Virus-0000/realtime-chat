import { LoaderCircle } from "lucide-react";

/**
 * variant: primary | secondary | ghost | danger
 * size: sm | md | lg
 */
export default function Button({
    variant = "primary",
    size = "md",
    loading = false,
    icon: Icon,
    children,
    className = "",
    disabled,
    type = "button",
    ...props
}) {
    return (
        <button
            type={type}
            className={`btn btn--${variant} btn--${size} ${className}`}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {loading ? (
                <LoaderCircle size={16} className="spin" aria-hidden="true" />
            ) : (
                Icon && <Icon size={16} aria-hidden="true" />
            )}
            {children && <span>{children}</span>}
        </button>
    );
}

export function IconButton({
    ref,
    icon: Icon,
    label,
    size = "md",
    variant = "ghost",
    active = false,
    badge,
    className = "",
    type = "button",
    ...props
}) {
    return (
        <button
            ref={ref}
            type={type}
            className={`icon-btn icon-btn--${size} icon-btn--${variant} ${
                active ? "is-active" : ""
            } ${className}`}
            aria-label={label}
            title={label}
            {...props}
        >
            <Icon size={size === "sm" ? 16 : 19} aria-hidden="true" />
            {badge ? <span className="icon-btn__badge">{badge}</span> : null}
        </button>
    );
}
