import { SquarePen } from "lucide-react";
import { LogoMark } from "../common/Logo";
import Button from "../common/Button";

// Shown on desktop when no conversation is selected
export default function EmptyChat({ onStartNew }) {
    return (
        <div className="empty-chat">
            <div className="empty-chat__art" aria-hidden="true">
                <span className="empty-chat__orb empty-chat__orb--a" />
                <span className="empty-chat__orb empty-chat__orb--b" />
                <span className="empty-chat__bubble empty-chat__bubble--in" />
                <span className="empty-chat__bubble empty-chat__bubble--out" />
                <LogoMark size={76} />
            </div>

            <h2 className="empty-chat__title">Your conversations live here</h2>
            <p className="empty-chat__text">
                Pick a conversation from the sidebar, or search for someone by name or
                email to start a new one.
            </p>

            <Button icon={SquarePen} onClick={onStartNew}>
                New conversation
            </Button>
        </div>
    );
}
