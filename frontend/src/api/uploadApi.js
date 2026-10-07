import api from "./axios";

// POST /upload (multipart). Resolves to { message, file: { url, name, type, size } }
export const uploadFile = async (file, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload", formData, {
        onUploadProgress: (event) => {
            if (onProgress && event.total) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        }
    });

    return response.data;
};
