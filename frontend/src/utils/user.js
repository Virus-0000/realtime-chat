// The API sometimes returns `id` (auth endpoints) and sometimes `_id`
// (Mongoose documents). Normalise so the UI can always use `_id`.
export const normalizeUser = (user) => {
    if (!user) return null;

    const id = user._id || user.id;

    return { ...user, _id: id, id };
};

// Works for both populated documents ({ _id }) and bare ObjectId strings.
export const idOf = (value) => {
    if (!value) return "";
    if (typeof value === "object") return String(value._id || value.id || "");
    return String(value);
};

// Cloudinary can resize + compress on the fly. Non-Cloudinary URLs are
// returned untouched. Callers fall back to the original URL on error.
export const optimizeImage = (url, transform = "f_auto,q_auto") => {
    if (!url || !url.includes("/image/upload/")) return url;
    if (url.includes("/upload/f_") || url.includes("/upload/c_")) return url;

    return url.replace("/upload/", `/upload/${transform}/`);
};
