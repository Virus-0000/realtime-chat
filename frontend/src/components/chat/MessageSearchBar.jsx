import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { IconButton } from "../common/Button";

// Search inside the open conversation
export default function MessageSearchBar({
    query,
    onQueryChange,
    matchCount,
    position,
    onOlder,
    onNewer,
    onClose
}) {
    const hasQuery = query.trim() !== "";

    return (
        <div className="msg-search" role="search">
            <Search size={16} className="msg-search__icon" aria-hidden="true" />

            <input
                data-autofocus
                autoFocus
                className="msg-search__input"
                placeholder="Search in this conversation"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") onClose();

                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (event.shiftKey) onNewer();
                        else onOlder();
                    }
                }}
                aria-label="Search in this conversation"
            />

            {hasQuery && (
                <span className="msg-search__count" aria-live="polite">
                    {matchCount > 0 ? `${position} of ${matchCount}` : "No results"}
                </span>
            )}

            <IconButton
                icon={ChevronUp}
                label="Previous match"
                size="sm"
                onClick={onOlder}
                disabled={matchCount === 0}
            />
            <IconButton
                icon={ChevronDown}
                label="Next match"
                size="sm"
                onClick={onNewer}
                disabled={matchCount === 0}
            />
            <IconButton icon={X} label="Close search" size="sm" onClick={onClose} />
        </div>
    );
}
