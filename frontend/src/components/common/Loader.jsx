import { LoaderCircle } from "lucide-react";

export function Spinner({ size = 18, className = "" }) {
    return (
        <LoaderCircle
            size={size}
            className={`spin ${className}`}
            role="status"
            aria-label="Loading"
        />
    );
}

export function Skeleton({ width, height = 12, radius = 6, className = "", style }) {
    return (
        <span
            className={`skeleton ${className}`}
            style={{ width, height, borderRadius: radius, ...style }}
            aria-hidden="true"
        />
    );
}

export default function Loader({ label = "Loading…" }) {
    return (
        <div className="loader" role="status">
            <Spinner size={22} />
            <span>{label}</span>
        </div>
    );
}
