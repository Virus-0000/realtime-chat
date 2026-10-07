import { useState } from "react";
import { ChevronsUpDown, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { useChat } from "../../context/chatContext";
import { useTheme } from "../../context/themeContext";
import Avatar from "../common/Avatar";
import ContextMenu from "../common/ContextMenu";

// Current-user card at the bottom of the sidebar + settings menu
export default function UserMenu({ onOpenProfile }) {
    const { logout } = useAuth();
    const { currentUser, connectionStatus } = useChat();
    const { theme, toggleTheme } = useTheme();
    const [menu, setMenu] = useState(null);

    const connected = connectionStatus === "connected";
    const statusLabel = connected
        ? "Online"
        : connectionStatus === "connecting"
        ? "Connecting…"
        : "Offline";

    const items = [
        { key: "profile", label: "Edit profile", icon: UserRound, onClick: onOpenProfile },
        {
            key: "theme",
            label: theme === "dark" ? "Light mode" : "Dark mode",
            icon: theme === "dark" ? Sun : Moon,
            onClick: toggleTheme
        },
        { type: "separator" },
        { key: "logout", label: "Sign out", icon: LogOut, danger: true, onClick: () => logout() }
    ];

    return (
        <>
            <button
                type="button"
                className={`user-card ${menu ? "is-open" : ""}`}
                aria-haspopup="menu"
                aria-expanded={Boolean(menu)}
                onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setMenu({ x: rect.left + 8, y: rect.top - 6 });
                }}
            >
                <Avatar user={currentUser} size="md" online={connected} />

                <span className="user-card__body">
                    <span className="user-card__name">{currentUser?.name}</span>
                    <span className="user-card__status">{statusLabel}</span>
                </span>

                <ChevronsUpDown size={16} className="user-card__chevron" aria-hidden="true" />
            </button>

            <ContextMenu
                open={Boolean(menu)}
                x={menu?.x ?? 0}
                y={menu?.y ?? 0}
                placement="top"
                items={items}
                onClose={() => setMenu(null)}
            />
        </>
    );
}
