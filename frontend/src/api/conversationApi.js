import api from "./axios";

export const getConversations = async () => {
    const response = await api.get("/conversations");
    return response.data;
};

export const createConversation = async (userId) => {
    const response = await api.post("/conversations", { userId });
    return response.data;
};
