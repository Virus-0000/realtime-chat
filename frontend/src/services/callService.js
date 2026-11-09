
let cachedIceServers = null;

export const loadIceServers = async () => {
    if (cachedIceServers) {
        return cachedIceServers;
    }

    const apiKey = import.meta.env.VITE_METERED_TURN_API_KEY;

    if (!apiKey) {
        throw new Error("Metered TURN API key is missing. Check frontend/.env");
    }

    const response = await fetch(
        `https://relay-chat-div.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch TURN credentials from Metered.");
    }

    cachedIceServers = await response.json();

    if (!Array.isArray(cachedIceServers) || cachedIceServers.length === 0) {
        throw new Error("Metered returned an invalid ICE server configuration.");
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
