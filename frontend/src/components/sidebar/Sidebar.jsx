import { useState } from "react";
import { SquarePen } from "lucide-react";
import Logo from "../common/Logo";
import ThemeToggle from "../common/ThemeToggle";
import { IconButton } from "../common/Button";
import ConversationList from "./ConversationList";
import UserSearch from "./UserSearch";
import UserMenu from "./UserMenu";

export default function Sidebar({ searchInputRef, onOpenProfile }) {
    const [query, setQuery] = useState("");

    const focusSearch = () => searchInputRef.current?.focus();

    return (
        <aside className="sidebar">
            <header className="sidebar__header">
                <Logo />

                <div className="sidebar__actions">
                    <ThemeToggle />
                    <IconButton
                        icon={SquarePen}
                        label="New conversation"
                        onClick={focusSearch}
                    />
                </div>
            </header>

            <UserSearch
                query={query}
                onQueryChange={setQuery}
                inputRef={searchInputRef}
            >
                <ConversationList onStartNew={focusSearch} />
            </UserSearch>

            <UserMenu onOpenProfile={onOpenProfile} />
        </aside>
    );
}
