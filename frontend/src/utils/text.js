const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'\]])/gi;

// Splits text into plain strings and { url } parts so links can be rendered
// as real <a> elements without dangerouslySetInnerHTML.
export const splitLinks = (text = "") => {
    const parts = [];
    let lastIndex = 0;

    for (const match of text.matchAll(URL_PATTERN)) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        parts.push({ url: match[0] });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts;
};

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}(?:\uFE0F|\u200D|\p{Emoji_Modifier})*\s*){1,3}$/u;

// 1-3 emoji and nothing else -> render large without a bubble
export const isEmojiOnly = (text = "") => EMOJI_ONLY.test(text.trim());

export const escapeRegExp = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
