const Conversation = require("../models/Conversation");

// Shared across all connected sockets.
const activeCalls = new Map();

const setupCallHandlers = (io, socket) => {
 const getParticipant = async (conversationId) => {
    if (!conversationId) return null;

    const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: socket.user._id
    });

    if (!conversation || conversation.participants.length !== 2) {
        return null;
    }

    return conversation.participants.find(
        (id) => String(id) !== String(socket.user._id)
    );
};

  const sendToParticipant = (userId, event, payload, ack) => {
    io.to(`user:${String(userId)}`)
        .timeout(5000)
        .emit(event, payload, (error, responses) => {
            ack?.({
                received:
                    !error &&
                    responses?.some((response) => response?.received)
            });
        });
};

    // Start a call
    socket.on("call:initiate", async (data, ack) => {
        try {
            const { conversationId, type } = data || {};

            if (!["audio", "video"].includes(type)) {
                return ack?.({ ok: false, error: "Invalid call type" });
            }

            const participant = await getParticipant(conversationId);

            if (!participant) {
                return ack?.({
                    ok: false,
                    error: "Invalid conversation or participants"
                });
            }
//             const recipientSockets = await io
//     .in(`user:${String(participant)}`)
//     .fetchSockets();

// if (recipientSockets.length === 0) {
//     return ack?.({
//         ok: false,
//         error: "User is offline"
//     });
// }
            const callId = String(conversationId);

if (activeCalls.has(callId)) {
    return ack?.({
        ok: false,
        error: "A call is already in progress"
    });
}            
         const timeout = setTimeout(() => {
    const currentCall = activeCalls.get(callId);

    if (currentCall?.status === "ringing") {
        activeCalls.delete(callId);

        sendToParticipant(participant, "call:ended", {
            conversationId,
            reason: "timeout"
        });

        io.to(`user:${String(socket.user._id)}`).emit("call:ended", {
            conversationId,
            reason: "timeout"
        });
    }
}, 30000);

activeCalls.set(callId, {
    callerId: String(socket.user._id),
    calleeId: String(participant),
    type,
    status: "ringing",
    timeout
});

          sendToParticipant(participant, "call:incoming", {
    conversationId,
    type,
    caller: {
        _id: socket.user._id,
        name: socket.user.name,
        profileImage: socket.user.profileImage
    }
}, (response) => {
    if (response?.received) {
        io.to(`user:${String(socket.user._id)}`).emit(
            "call:ringing",
            { conversationId }
        );
    }
});

ack?.({ ok: true });
        } catch (error) {
            console.error("Call initiation error:", error.message);
            ack?.({ ok: false, error: "Unable to initiate call" });
        }
    });

    // Accept or reject a call
socket.on("call:response", async (data) => {
    try {
        const { conversationId, accepted } = data || {};
        const call = activeCalls.get(String(conversationId));

        if (
            !call ||
            call.status !== "ringing" ||
            call.calleeId !== String(socket.user._id)
        ) {
            return;
        }

        const participant = await getParticipant(conversationId);
      if (!participant) {
    if (call.timeout) {
        clearTimeout(call.timeout);
    }

    activeCalls.delete(String(conversationId));
    return;
}
if (call.timeout) {
    clearTimeout(call.timeout);
    call.timeout = null;
}

if (accepted === true) {
    call.status = "active";
} else {
    activeCalls.delete(String(conversationId));
}

        sendToParticipant(participant, "call:response", {
            conversationId,
            accepted: accepted === true,
            responderId: String(socket.user._id)
        });
    } catch (error) {
        console.error("Call response error:", error.message);
    }
});

    // Forward WebRTC offer, answer and ICE candidates
       const relaySignal = async (event, targetEvent, allowedSender) => {
        socket.on(event, async (data) => {
            try {
                const { conversationId, signal } = data || {};
                const call = activeCalls.get(String(conversationId));
                const senderId = String(socket.user._id);

                if (!call || call.status !== "active" || !signal) return;

                if (
                    allowedSender === "caller" &&
                    call.callerId !== senderId
                ) return;

                if (
                    allowedSender === "callee" &&
                    call.calleeId !== senderId
                ) return;

                if (
                    allowedSender === "either" &&
                    ![call.callerId, call.calleeId].includes(senderId)
                ) return;

                const participant = await getParticipant(conversationId);
                if (!participant) return;

                sendToParticipant(participant, targetEvent, {
                    conversationId,
                    signal,
                    senderId
                });
            } catch (error) {
                console.error(`${event} error:`, error.message);
            }
        });
    };

    relaySignal("call:offer", "call:offer", "caller");
    relaySignal("call:answer", "call:answer", "callee");
    relaySignal("call:ice-candidate", "call:ice-candidate", "either");

    // End or reject a call
  socket.on("call:end", async (data) => {
    try {
        const { conversationId } = data || {};
        const callId = String(conversationId);
        const call = activeCalls.get(callId);
        const senderId = String(socket.user._id);

        if (
            !call ||
            ![call.callerId, call.calleeId].includes(senderId)
        ) {
            return;
        }

        const participant = await getParticipant(conversationId);
if (call.timeout) {
    clearTimeout(call.timeout);
    call.timeout = null;
}
        activeCalls.delete(callId);

        if (!participant) return;

        sendToParticipant(participant, "call:ended", {
            conversationId,
            endedBy: senderId
        });
    } catch (error) {
        console.error("Call end error:", error.message);
    }
});
    socket.on("disconnect", () => {
        const disconnectedUserId = String(socket.user._id);

        for (const [conversationId, call] of activeCalls.entries()) {
            if (
                call.callerId === disconnectedUserId ||
                call.calleeId === disconnectedUserId
            ) {
                if (call.timeout) {
    clearTimeout(call.timeout);
    call.timeout = null;
}
                activeCalls.delete(conversationId);

                const otherUserId =
                    call.callerId === disconnectedUserId
                        ? call.calleeId
                        : call.callerId;

                sendToParticipant(otherUserId, "call:ended", {
                    conversationId,
                    endedBy: disconnectedUserId
                });
            }
        }
    });
};

module.exports = setupCallHandlers;