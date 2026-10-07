import api from "./axios";

export const getMessages = async (conversationId) => {
    const response = await api.get(`/messages/${conversationId}`);
    return response.data;
};

export const markConversationRead = async (conversationId) => {
    const response = await api.patch(`/messages/read/${conversationId}`);
    return response.data;
};
