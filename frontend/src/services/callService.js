import api from "../api/axios";

let cachedIceServers = null;

export const loadIceServers = async () => {
    if (cachedIceServers) {
        return cachedIceServers;
    }

    const response = await api.get("/calls/ice-servers");
    cachedIceServers = response.data;

    if (!Array.isArray(cachedIceServers) || cachedIceServers.length === 0) {
        cachedIceServers = null;
        throw new Error("Invalid ICE server configuration.");
    }

    return cachedIceServers;
};

export const createPeerConnection = () => {
    if (!cachedIceServers) {
        throw new Error("ICE servers are not loaded. Call loadIceServers() first.");
    }

    return new RTCPeerConnection({
        iceServers: cachedIceServers
    });
};

export const getLocalMedia = async (type) => {
    return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video"
    });
};

export const stopLocalMedia = (stream) => {
    if (!stream) return;

    stream.getTracks().forEach((track) => {
        track.stop();
    });
};
