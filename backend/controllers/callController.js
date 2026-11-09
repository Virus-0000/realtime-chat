const getIceServers = async (req, res) => {
    try {
        const apiKey = process.env.METERED_TURN_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                message: "TURN service is not configured"
            });
        }

        const response = await fetch(
            `https://relay-chat-div.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`
        );

        if (!response.ok) {
            console.error("Metered API status:", response.status);

            return res.status(502).json({
                message: "Unable to retrieve TURN credentials"
            });
        }

        const iceServers = await response.json();

        if (!Array.isArray(iceServers) || iceServers.length === 0) {
            return res.status(502).json({
                message: "Invalid TURN server configuration"
            });
        }

        return res.status(200).json(iceServers);
    } catch (error) {
        console.error("TURN credentials error:", error.message);

        return res.status(502).json({
            message: "TURN service request failed"
        });
    }
};

module.exports = { getIceServers };
