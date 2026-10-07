import { CalendarDays, Clock, Copy, Info, Mail, X } from "lucide-react";
import { useChat } from "../../context/chatContext";
import { useToast } from "../../context/toastContext";
import useTick from "../../hooks/useTick";
import { formatLastSeen, formatMonthYear } from "../../utils/format";
import { getFileKind } from "../../utils/files";
import { optimizeImage } from "../../utils/user";
import Avatar from "../common/Avatar";
import { IconButton } from "../common/Button";
import { PresenceStatus } from "../chat/ChatHeader";
import { FileCard } from "../chat/FileAttachment";

function InfoRow({ icon: Icon, label, children, action }) {
    return (
        <div className="info-row">
            <span className="info-row__icon">
                <Icon size={17} aria-hidden="true" />
            </span>
            <div className="info-row__body">
                <span className="info-row__label">{label}</span>
                <span className="info-row__value">{children}</span>
            </div>
            {action}
        </div>
    );
}

// Slides in from the right (column on desktop, drawer on smaller screens)
export default function ProfilePanel({ open, onClose, onOpenImage }) {
    const { otherUser, messages, isOnline, getLastSeen } = useChat();
    const toast = useToast();

    useTick();

    const withFiles = messages.filter((message) => message.fileUrl && !message.pending);
    const media = withFiles
        .filter((message) => getFileKind(message.fileType, message.fileName) === "image")
        .reverse();
    const files = withFiles
        .filter((message) => getFileKind(message.fileType, message.fileName) !== "image")
        .reverse();

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(otherUser.email);
            toast.success("Email copied");
        } catch {
            toast.error("Couldn't copy the email");
        }
    };

    return (
        <>
            <div
                className={`panel-backdrop ${open ? "is-open" : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`profile-panel ${open ? "is-open" : ""}`}
                aria-label="Contact profile"
                aria-hidden={!open}
                inert={!open}
            >
                <div className="profile-panel__inner">
                    <header className="profile-panel__header">
                        <h2>Contact info</h2>
                        <IconButton icon={X} label="Close panel" size="sm" onClick={onClose} />
                    </header>

                    {otherUser && (
                        <div className="profile-panel__scroll">
                            <section className="profile-hero">
                                <button
                                    type="button"
                                    className="profile-hero__avatar"
                                    disabled={!otherUser.profileImage}
                                    onClick={() =>
                                        onOpenImage({
                                            url: otherUser.profileImage,
                                            name: otherUser.name
                                        })
                                    }
                                    aria-label="View profile photo"
                                >
                                    <Avatar
                                        user={otherUser}
                                        size="xxl"
                                        online={isOnline(otherUser)}
                                        showOffline
                                    />
                                </button>
                                <h3 className="profile-hero__name">{otherUser.name}</h3>
                                <PresenceStatus user={otherUser} />
                            </section>

                            <section className="info-card">
                                <InfoRow
                                    icon={Mail}
                                    label="Email"
                                    action={
                                        <IconButton
                                            icon={Copy}
                                            label="Copy email"
                                            size="sm"
                                            onClick={copyEmail}
                                        />
                                    }
                                >
                                    {otherUser.email}
                                </InfoRow>

                                <InfoRow icon={Info} label="About">
                                    {otherUser.bio ? (
                                        otherUser.bio
                                    ) : (
                                        <span className="muted">No bio yet</span>
                                    )}
                                </InfoRow>

                                <InfoRow icon={Clock} label="Last seen">
                                    {isOnline(otherUser)
                                        ? "Active now"
                                        : formatLastSeen(getLastSeen(otherUser)).replace(
                                              "Last seen ",
                                              ""
                                          )}
                                </InfoRow>

                                {otherUser.createdAt && (
                                    <InfoRow icon={CalendarDays} label="Joined">
                                        {formatMonthYear(otherUser.createdAt)}
                                    </InfoRow>
                                )}
                            </section>

                            <section className="shared">
                                <h4 className="section-label">
                                    Shared media
                                    {media.length > 0 && <span>{media.length}</span>}
                                </h4>

                                {media.length === 0 ? (
                                    <p className="shared__empty">
                                        Photos shared in this conversation will appear here.
                                    </p>
                                ) : (
                                    <div className="media-grid">
                                        {media.slice(0, 9).map((message) => (
                                            <button
                                                key={message._id}
                                                type="button"
                                                className="media-grid__item"
                                                onClick={() =>
                                                    onOpenImage({
                                                        url: message.fileUrl,
                                                        name: message.fileName
                                                    })
                                                }
                                                aria-label={`Open ${message.fileName || "image"}`}
                                            >
                                                <img
                                                    src={optimizeImage(
                                                        message.fileUrl,
                                                        "c_fill,w_240,h_240,f_auto,q_auto"
                                                    )}
                                                    alt=""
                                                    loading="lazy"
                                                    onError={(event) => {
                                                        if (event.currentTarget.src !== message.fileUrl) {
                                                            event.currentTarget.src = message.fileUrl;
                                                        }
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="shared">
                                <h4 className="section-label">
                                    Shared files
                                    {files.length > 0 && <span>{files.length}</span>}
                                </h4>

                                {files.length === 0 ? (
                                    <p className="shared__empty">
                                        Documents shared in this conversation will appear here.
                                    </p>
                                ) : (
                                    <div className="shared__files">
                                        {files.slice(0, 6).map((message) => (
                                            <FileCard key={message._id} {...message} compact />
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
