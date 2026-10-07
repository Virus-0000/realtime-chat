export function LogoMark({ size = 32 }) {
    return (
        <svg
            className="logo-mark"
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
        >
            <defs>
                <linearGradient
                    id="relay-logo-gradient"
                    x1="8"
                    y1="4"
                    x2="56"
                    y2="60"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#7A7DFF" />
                    <stop offset="1" stopColor="#4A4DE0" />
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="18" fill="url(#relay-logo-gradient)" />
            <path
                d="M18 22a8 8 0 0 1 8-8h14a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8h-8l-8 7v-7.4A8 8 0 0 1 18 30v-8Z"
                fill="#fff"
            />
            <path
                d="M30 42h8l7 6v-6.4A7 7 0 0 0 50 35v-2"
                stroke="#fff"
                strokeOpacity=".55"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function Logo({ size = 32, showName = true }) {
    return (
        <span className="logo">
            <LogoMark size={size} />
            {showName && <span className="logo__name">Relay</span>}
        </span>
    );
}
