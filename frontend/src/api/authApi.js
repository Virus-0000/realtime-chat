import api from "./axios";

export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
};

export const loginUser = async (userData) => {
    const response = await api.post("/auth/login", userData);
    return response.data;
};

// GET /auth/search?search=term
export const searchUsers = async (search, signal) => {
    const response = await api.get("/auth/search", {
        params: { search },
        signal
    });
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get("/auth/profile");
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
};
