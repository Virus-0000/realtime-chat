export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    tone = "neutral",
    compact = false
}) {
    return (
        <div className={`empty-state empty-state--${tone} ${compact ? "empty-state--compact" : ""}`}>
            {Icon && (
                <span className="empty-state__icon">
                    <Icon size={compact ? 22 : 28} aria-hidden="true" />
                </span>
            )}
            <h3 className="empty-state__title">{title}</h3>
            {description && <p className="empty-state__text">{description}</p>}
            {action && <div className="empty-state__action">{action}</div>}
        </div>
    );
}
