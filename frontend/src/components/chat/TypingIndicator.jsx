// Three softly bouncing dots
export default function TypingIndicator({ className = "" }) {
    return (
        <span className={`typing-dots ${className}`} aria-hidden="true">
            <i />
            <i />
            <i />
        </span>
    );
}
