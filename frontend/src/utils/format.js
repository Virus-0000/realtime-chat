// Date / number formatting helpers. They read the current time internally so
// components can stay pure.

const DAY = 86400000;

const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

// 0 = today, 1 = yesterday ...
const dayDiff = (value) =>
    Math.round((startOfDay(Date.now()) - startOfDay(value)) / DAY);

export const formatTime = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
    });
};

export const isSameDay = (a, b) =>
    startOfDay(a).getTime() === startOfDay(b).getTime();

// Date separators inside a conversation
export const formatDayLabel = (value) => {
    const diff = dayDiff(value);
    const date = new Date(value);

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";

    if (diff > 1 && diff < 7) {
        return date.toLocaleDateString([], { weekday: "long" });
    }

    return date.toLocaleDateString([], {
        month: "long",
        day: "numeric",
        year:
            date.getFullYear() === new Date().getFullYear()
                ? undefined
                : "numeric"
    });
};

// Timestamp shown in the conversation list
export const formatListTime = (value) => {
    if (!value) return "";

    const diff = dayDiff(value);
    const date = new Date(value);

    if (diff === 0) return formatTime(value);
    if (diff === 1) return "Yesterday";

    if (diff > 1 && diff < 7) {
        return date.toLocaleDateString([], { weekday: "short" });
    }

    return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year:
            date.getFullYear() === new Date().getFullYear()
                ? undefined
                : "2-digit"
    });
};

export const formatLastSeen = (value) => {
    if (!value) return "Offline";

    const date = new Date(value);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

    if (minutes < 1) return "Last seen just now";
    if (minutes < 60) return `Last seen ${minutes} min ago`;

    const diff = dayDiff(value);

    if (diff === 0) return `Last seen today at ${formatTime(value)}`;
    if (diff === 1) return `Last seen yesterday at ${formatTime(value)}`;

    return `Last seen ${date.toLocaleDateString([], {
        month: "short",
        day: "numeric"
    })} at ${formatTime(value)}`;
};

export const formatMonthYear = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleDateString([], {
        month: "long",
        year: "numeric"
    });
};

export const formatFullDateTime = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
};

export const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;

    const units = ["KB", "MB", "GB"];
    let size = bytes / 1024;
    let unit = 0;

    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }

    return `${size >= 10 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`;
};

export const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
