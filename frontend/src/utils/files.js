const EXTENSION_GROUPS = {
    pdf: ["pdf"],
    doc: ["doc", "docx", "odt", "rtf", "pages"],
    sheet: ["xls", "xlsx", "csv", "ods", "numbers"],
    slides: ["ppt", "pptx", "key", "odp"],
    archive: ["zip", "rar", "7z", "tar", "gz"],
    audio: ["mp3", "wav", "ogg", "m4a", "flac", "aac"],
    video: ["mp4", "mov", "avi", "mkv", "webm"],
    code: ["js", "jsx", "ts", "tsx", "json", "html", "css", "py", "java", "c", "cpp", "go", "rs", "sh", "xml", "yml", "yaml"],
    text: ["txt", "md", "log"]
};

export const getExtension = (name = "") => {
    const index = name.lastIndexOf(".");
    return index > -1 ? name.slice(index + 1).toLowerCase() : "";
};

// Returns one of: image | pdf | doc | sheet | slides | archive | audio | video | code | text | file
export const getFileKind = (fileType = "", fileName = "") => {
    if (fileType?.startsWith("image/")) return "image";
    if (fileType?.startsWith("audio/")) return "audio";
    if (fileType?.startsWith("video/")) return "video";

    const extension = getExtension(fileName);

    for (const [kind, extensions] of Object.entries(EXTENSION_GROUPS)) {
        if (extensions.includes(extension)) return kind;
    }

    return "file";
};

// Short label such as "PDF" or "DOCX"
export const getFileLabel = (fileType = "", fileName = "") => {
    const extension = getExtension(fileName);

    if (extension) return extension.toUpperCase();

    return fileType?.split("/")[1]?.toUpperCase() || "FILE";
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // matches the backend multer limit

// Returns an error message, or null when the file can be sent
export const validateAttachment = (file) => {
    if (!file) return "No file selected";
    if (file.size === 0) return "That file is empty";
    if (file.size > MAX_FILE_SIZE) return "Files must be smaller than 10 MB";

    return null;
};

// Snippet text for a (possibly file-only) message
export const describeMessage = (message) => {
    if (message?.text) return message.text;
    if (!message?.fileUrl) return "Message";

    return getFileKind(message.fileType, message.fileName) === "image"
        ? "Photo"
        : message.fileName || "File";
};
