import { useState } from "react";
import { getInitials } from "../../utils/format";
import { optimizeImage } from "../../utils/user";

const hueOf = (seed = "") => {
    let hash = 0;

    for (const char of seed) {
        hash = (hash * 31 + char.charCodeAt(0)) % 360;
    }

    return hash;
};

const PIXELS = { xs: 48, sm: 72, md: 96, lg: 128, xl: 256, xxl: 384 };

/**
 * size: xs 24 · sm 32 · md 40 · lg 48 · xl 96 · xxl 120
 * online: true shows a presence dot; `showOffline` also shows the idle dot.
 */
export default function Avatar({
    user,
    size = "md",
    online,
    showOffline = false,
    src: srcOverride,
    className = ""
}) {
    const original = srcOverride ?? user?.profileImage;
    const [stage, setStage] = useState({ src: original, level: 0 });

    // Reset the fallback ladder when the image URL changes
    if (stage.src !== original) {
        setStage({ src: original, level: 0 });
    }

    const optimized =
        stage.level === 0
            ? optimizeImage(
                  original,
                  `c_fill,g_auto,w_${PIXELS[size] || 96},h_${PIXELS[size] || 96},f_auto,q_auto`
              )
            : original;

    const showImage = original && stage.level < 2;
    const seed = user?.name || user?.email || "?";

    return (
        <span
            className={`avatar avatar--${size} ${className}`}
            style={{ "--h": hueOf(seed) }}
        >
            {showImage ? (
                <img
                    src={optimized}
                    alt=""
                    draggable={false}
                    onError={() =>
                        setStage((current) => ({
                            ...current,
                            level: current.level + 1
                        }))
                    }
                />
            ) : (
                <span className="avatar__initials">
                    {getInitials(user?.name)}
                </span>
            )}

            {(online || showOffline) && (
                <span
                    className={`presence ${online ? "presence--online" : ""}`}
                    aria-label={online ? "Online" : "Offline"}
                />
            )}
        </span>
    );
}
