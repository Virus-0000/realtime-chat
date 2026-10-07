import { Link } from "react-router-dom";
import { Lock, Zap, CheckCheck } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const FEATURES = [
    { icon: Zap, title: "Instant delivery", text: "Messages arrive the moment they're sent." },
    { icon: CheckCheck, title: "Read receipts", text: "Know when it's delivered, and when it's read." },
    { icon: Lock, title: "Your account, secured", text: "JWT-authenticated sessions end to end." }
];

export default function AuthLayout({ title, subtitle, children, footer }) {
    return (
        <div className="auth">
            <aside className="auth__brand">
                <Logo size={36} />

                <div className="auth__pitch">
                    <h2>Conversations that feel effortless.</h2>
                    <p>
                        A fast, focused place to talk — with presence, typing indicators,
                        files and replies built in.
                    </p>

                    <ul className="auth__features">
                        {FEATURES.map(({ icon: Icon, title: featureTitle, text }) => (
                            <li key={featureTitle}>
                                <span><Icon size={18} aria-hidden="true" /></span>
                                <div>
                                    <strong>{featureTitle}</strong>
                                    <small>{text}</small>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <span className="auth__orb auth__orb--a" aria-hidden="true" />
                <span className="auth__orb auth__orb--b" aria-hidden="true" />
            </aside>

            <main className="auth__panel">
                <div className="auth__top">
                    <span className="auth__top-logo"><Logo size={30} /></span>
                    <ThemeToggle />
                </div>

                <div className="auth__card">
                    <h1>{title}</h1>
                    <p className="auth__subtitle">{subtitle}</p>
                    {children}
                    <p className="auth__footer">{footer}</p>
                </div>

                <small className="auth__legal">
                    <Link to="/login">Relay</Link> · Realtime chat
                </small>
            </main>
        </div>
    );
}
