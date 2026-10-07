import { Component } from "react";
import { TriangleAlert } from "lucide-react";

// Last line of defence: never show a blank white screen
export default class ErrorBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error, info) {
        console.error("Unhandled UI error:", error, info);
    }

    render() {
        if (!this.state.failed) return this.props.children;

        return (
            <div className="fatal">
                <span className="fatal__icon"><TriangleAlert size={28} /></span>
                <h1>Something went wrong</h1>
                <p>An unexpected error occurred. Reloading usually fixes it.</p>
                <button
                    type="button"
                    className="btn btn--primary btn--md"
                    onClick={() => window.location.reload()}
                >
                    Reload app
                </button>
            </div>
        );
    }
}
