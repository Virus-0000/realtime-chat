import axios from "axios";

// Single place that knows where the backend lives.
export const API_ORIGIN =
    import.meta.env.VITE_API_URL || "http://localhost:5001";

const api = axios.create({
    baseURL: `${API_ORIGIN}/api`
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Expired / invalid token -> let the app log the user out.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || "";
        const isAuthForm =
            url.includes("/auth/login") ||
            url.includes("/auth/register");

        if (error.response?.status === 401 && !isAuthForm) {
            window.dispatchEvent(new Event("auth:unauthorized"));
        }

        return Promise.reject(error);
    }
);

// Human readable message for any request error.
export const getErrorMessage = (error, fallback = "Something went wrong") => {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.code === "ERR_NETWORK") {
        return "Can't reach the server. Check your connection.";
    }

    return fallback;
};

export default api;
