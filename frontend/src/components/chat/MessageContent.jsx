import { escapeRegExp, splitLinks } from "../../utils/text";

// Renders text with clickable links and optional search highlighting.
function Highlighted({ text, query }) {
    if (!query) return text;

    const pattern = new RegExp(`(${escapeRegExp(query)})`, "gi");

    return text
        .split(pattern)
        .map((part, index) =>
            index % 2 === 1 ? <mark key={index}>{part}</mark> : part
        );
}

export default function MessageContent({ text, highlight }) {
    return splitLinks(text).map((part, index) =>
        typeof part === "string" ? (
            <Highlighted key={index} text={part} query={highlight} />
        ) : (
            <a
                key={index}
                href={part.url}
                target="_blank"
                rel="noopener noreferrer"
                className="msg__link"
            >
                <Highlighted text={part.url} query={highlight} />
            </a>
        )
    );
}
