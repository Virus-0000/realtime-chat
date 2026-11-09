import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";
import { ChatContext } from "./chatContext";
import { useAuth } from "./authContext";
import { useToast } from "./toastContext";
import useSocket from "../hooks/useSocket";
import {
    createConversation,
    getConversations
} from "../api/conversationApi";
import { getMessages, markConversationRead } from "../api/messageApi";
import { uploadFile } from "../api/uploadApi";
import { getErrorMessage } from "../api/axios";
import { idOf } from "../utils/user";
import {
    createPeerConnection,
    getLocalMedia,
    stopLocalMedia,
    loadIceServers
} from "../services/callService";

const APP_TITLE = "Relay — Realtime Chat";
const TYPING_TIMEOUT = 5000;

const stamp = (conversation) =>
    new Date(
        conversation.lastMessage?.createdAt ||
            conversation.updatedAt ||
            conversation.createdAt ||
            0
    ).getTime();

const sortConversations = (list) =>
    [...list].sort((a, b) => stamp(b) - stamp(a));

const makeClientId = () =>
    `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export default function ChatProvider({ children }) {
    const { user, updateUser } = useAuth();
    const { socket, status: connectionStatus } = useSocket();
    const toast = useToast();

    const userId = user?._id ? String(user._id) : "";

    // ---------------------------------------------------------------- state
    const [conversations, setConversations] = useState([]);
    const [conversationsStatus, setConversationsStatus] = useState("loading");
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesStatus, setMessagesStatus] = useState("idle");
    const [onlineIds, setOnlineIds] = useState(() => new Set());
    const [presenceReady, setPresenceReady] = useState(false);
    const [lastSeenMap, setLastSeenMap] = useState({});
    const [typingMap, setTypingMap] = useState({});
    const [replyTo, setReplyTo] = useState(null);
    const [editing, setEditing] = useState(null);
    // ------------------------------------------------------------ call state
const [call, setCall] = useState(null);
const [localStream, setLocalStream] = useState(null);
const [remoteStream, setRemoteStream] = useState(null);
const [muted, setMuted] = useState(false);
const [cameraOff, setCameraOff] = useState(false);

    // Latest values for socket handlers (which are registered only once)
    const activeIdRef = useRef(null);
    const conversationsRef = useRef([]);
    const peerConnectionRef = useRef(null);
const callRef = useRef(null);
const outgoingRingtoneRef = useRef(null);
const incomingRingtoneRef = useRef(null);
const pendingIceCandidatesRef = useRef([]);
const localStreamRef = useRef(null);
const remoteStreamRef = useRef(null);
    const userIdRef = useRef(userId);
    const socketRef = useRef(null);
    const typingTimers = useRef(new Map());
    const localTyping = useRef({ lastSent: 0, timer: null, conversationId: null });
    const hasConnectedBefore = useRef(false);

    useEffect(() => {
        activeIdRef.current = activeId;
        conversationsRef.current = conversations;
        userIdRef.current = userId;
        socketRef.current = socket;
        callRef.current = call;
    });

  const cleanupCall = useCallback((notifyPeer = false) => {
    if (outgoingRingtoneRef.current) {
        outgoingRingtoneRef.current.pause();
        outgoingRingtoneRef.current.currentTime = 0;
        outgoingRingtoneRef.current = null;
    }
    if (incomingRingtoneRef.current) {
    incomingRingtoneRef.current.pause();
    incomingRingtoneRef.current.currentTime = 0;
    incomingRingtoneRef.current = null;
}

    const currentCall = callRef.current;
    callRef.current = null;
    if (notifyPeer && currentCall?.conversationId) {
        socketRef.current?.emit("call:end", {
            conversationId: currentCall.conversationId
        });
    }

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    stopLocalMedia(localStreamRef.current);

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingIceCandidatesRef.current = [];

    setCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setCameraOff(false);
}, []);
const startCall = useCallback(async (type) => {
    const conversationId = activeIdRef.current;
    const currentSocket = socketRef.current;

    if (!conversationId) {
        toast.error("Open a conversation before starting a call.");
        return;
    }

    if (!currentSocket?.connected) {
        toast.error("You're offline. Please reconnect first.");
        return;
    }

    if (callRef.current) {
        toast.error("You already have an active call.");
        return;
    }

    if (!["audio", "video"].includes(type)) return;

    const conversation = conversationsRef.current.find(
        (item) => String(item._id) === String(conversationId)
    );

    const participant = conversation?.participants?.find(
        (person) => String(person._id) !== userIdRef.current
    );

    if (!participant) {
        toast.error("Couldn't find the other participant.");
        return;
    }
const ringtone = new Audio(
    "/sounds/incoming-ringtone.mp3"
);

ringtone.loop = true;
outgoingRingtoneRef.current = ringtone;

ringtone.play().catch((error) => {
    console.warn("Outgoing ringtone playback was blocked:", error);
});
    try {
     const stream = await getLocalMedia(type);


try {
    await loadIceServers();
} catch (error) {
    stopLocalMedia(stream);
    throw error;
}

        if (!socketRef.current?.connected) {
            stopLocalMedia(stream);
            toast.error("Connection lost. Please try again.");
            return;
        }

        const nextCall = {
            conversationId,
            type,
            direction: "outgoing",
            status: "calling",
            otherUser: participant
        };

        localStreamRef.current = stream;
        setLocalStream(stream);

        callRef.current = nextCall;
        setCall(nextCall);

        socketRef.current.emit(
            "call:initiate",
            { conversationId, type },
            (response) => {
                if (!response?.ok) {
                    cleanupCall(false);
                  toast.error(
    response?.error === "User is offline"
        ? "This user is offline."
        : response?.error || "Couldn't start the call."
);
                }
            }
        );
    } catch (error) {
        console.error("Unable to access call media:", error);
        cleanupCall(false);
        toast.error(
            "Couldn't access your microphone or camera. Check browser permissions."
        );
    }
}, [cleanupCall, toast]);
const createCallPeerConnection = useCallback(() => {
    const currentCall = callRef.current;

    if (!currentCall) return null;

    const peerConnection = createPeerConnection();

    peerConnectionRef.current = peerConnection;

    // Add local microphone and camera tracks.
    localStreamRef.current?.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
    });

    // Send ICE candidates to the other participant.
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socketRef.current?.emit("call:ice-candidate", {
                conversationId: currentCall.conversationId,
                signal: event.candidate
            });
        }
    };

    // Receive the other participant's media stream.
    peerConnection.ontrack = (event) => {
        const stream = event.streams[0];

        if (stream) {
            remoteStreamRef.current = stream;
            setRemoteStream(stream);
        }
    };
// Inspect the selected ICE candidate pair.
peerConnection.oniceconnectionstatechange = async () => {
    if (
        peerConnection.iceConnectionState !== "connected" &&
        peerConnection.iceConnectionState !== "completed"
    ) {
        return;
    }

    const stats = await peerConnection.getStats();

    stats.forEach((report) => {
        if (report.type === "candidate-pair" && report.nominated && report.state === "succeeded") {
            const local = stats.get(report.localCandidateId);
            const remote = stats.get(report.remoteCandidateId);

            console.log("ICE CONNECTION DETAILS:", {
                localCandidate: local?.candidateType,
                remoteCandidate: remote?.candidateType,
                protocol: local?.protocol
            });
        }
    });
};

// Track the connection status.
peerConnection.onconnectionstatechange = () => {
    const status = peerConnection.connectionState;

    if (status === "connected") {
        setCall((previous) =>
            previous ? { ...previous, status: "connected" } : previous
        );
    } else if (status === "connecting") {
        setCall((previous) =>
            previous ? { ...previous, status: "connecting" } : previous
        );
    } else if (status === "failed" || status === "closed") {
        cleanupCall(false);
    }
};return peerConnection;
}, [cleanupCall]);

const acceptCall = useCallback(async () => {
    const currentCall = callRef.current;

    if (!currentCall || currentCall.direction !== "incoming") return;

    try {
     const stream = await getLocalMedia(currentCall.type);

try {
    await loadIceServers();
} catch (error) {
    stopLocalMedia(stream);
    throw error;
}

        localStreamRef.current = stream;
        setLocalStream(stream);

        const peerConnection = createCallPeerConnection();

        if (!peerConnection) {
            stopLocalMedia(stream);
            localStreamRef.current = null;
            setLocalStream(null);
            return;
        }

        const nextCall = {
            ...currentCall,
            status: "connecting"
        };

        callRef.current = nextCall;
        setCall(nextCall);

        socketRef.current?.emit("call:response", {
            conversationId: currentCall.conversationId,
            accepted: true
        });
    } catch (error) {
        console.error("Failed to accept call:", error);
        cleanupCall(false);
        toast.error(
            "Couldn't access your microphone or camera. Check browser permissions."
        );
    }
}, [createCallPeerConnection, cleanupCall, toast]);

const rejectCall = useCallback(() => {
    const currentCall = callRef.current;

    if (!currentCall || currentCall.direction !== "incoming") return;

    socketRef.current?.emit("call:response", {
        conversationId: currentCall.conversationId,
        accepted: false
    });

    cleanupCall(false);
}, [cleanupCall]);

const endCall = useCallback(() => {
    cleanupCall(true);
}, [cleanupCall]);
const toggleMute = useCallback(() => {
    const audioTracks = localStreamRef.current?.getAudioTracks() || [];

    if (!audioTracks.length) return;

    const nextMuted = !muted;

    audioTracks.forEach((track) => {
        track.enabled = !nextMuted;
    });

    setMuted(nextMuted);
}, [muted]);

const toggleCamera = useCallback(() => {
    const videoTracks = localStreamRef.current?.getVideoTracks() || [];

    if (!videoTracks.length) return;

    const nextCameraOff = !cameraOff;

    videoTracks.forEach((track) => {
        track.enabled = !nextCameraOff;
    });

    setCameraOff(nextCameraOff);
}, [cameraOff]);

    // ------------------------------------------------------- conversations
    const loadConversations = useCallback(
        () =>
            getConversations()
                .then((data) => {
                    setConversations(sortConversations(data));
                    setConversationsStatus("ready");
                })
                .catch((error) => {
                    console.error("Failed to fetch conversations:", error);
                    setConversationsStatus((previous) =>
                        previous === "ready" ? previous : "error"
                    );
                }),
        []
    );

    const reloadConversations = useCallback(() => {
        setConversationsStatus("loading");
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);


    // ------------------------------------------------------------ read state
    const markRead = useCallback((conversationId) => {
        const current = socketRef.current;

        if (current?.connected) {
            current.emit("markMessagesRead", conversationId);
        } else {
            markConversationRead(conversationId).catch(() => {});
        }

        setConversations((previous) =>
            previous.map((conversation) =>
                conversation._id === conversationId
                    ? { ...conversation, unreadCount: 0 }
                    : conversation
            )
        );
    }, []);

    // -------------------------------------------------------------- messages
    const fetchMessages = useCallback(
        (conversationId, { silent = false } = {}) =>
            getMessages(conversationId)
                .then((data) => {
                    if (activeIdRef.current !== conversationId) return;

                    // Keep messages that failed to send; everything else is
                    // replaced by the server's truth.
                    setMessages((previous) => [
                        ...data,
                        ...previous.filter((message) => message.failed)
                    ]);
                    setMessagesStatus("ready");

                    const conversation = conversationsRef.current.find(
                        (item) => item._id === conversationId
                    );

                    const hasUnread =
                        conversation?.unreadCount > 0 ||
                        data.some(
                            (message) =>
                                idOf(message.sender) !== userIdRef.current &&
                                !message.isRead
                        );

                    if (hasUnread) markRead(conversationId);
                })
                .catch((error) => {
                    console.error("Failed to fetch messages:", error);

                    if (activeIdRef.current === conversationId && !silent) {
                        setMessagesStatus("error");
                    }
                }),
        [markRead]
    );

    useEffect(() => {
        if (!activeId) return;

        fetchMessages(activeId);
    }, [activeId, fetchMessages]);

    const retryMessages = useCallback(() => {
        if (!activeIdRef.current) return;

        setMessagesStatus("loading");
        fetchMessages(activeIdRef.current);
    }, [fetchMessages]);

    // --------------------------------------------------------------- typing
    const stopTyping = useCallback(() => {
        const state = localTyping.current;

        clearTimeout(state.timer);

        if (state.lastSent && state.conversationId) {
            socketRef.current?.emit("stopTyping", state.conversationId);
        }

        state.lastSent = 0;
        state.conversationId = null;
    }, []);

    // Called on every keystroke; emits at most once every 2 seconds and sends
    // "stopTyping" automatically when the user pauses.
    const notifyTyping = useCallback(() => {
        const conversationId = activeIdRef.current;
        const current = socketRef.current;

        if (!conversationId || !current?.connected) return;

        const state = localTyping.current;
        const now = Date.now();

        if (now - state.lastSent > 2000) {
            current.emit("typing", conversationId);
            state.lastSent = now;
            state.conversationId = conversationId;
        }

        clearTimeout(state.timer);
        state.timer = setTimeout(stopTyping, 2000);
    }, [stopTyping]);

    // ------------------------------------------------- open / close / start
    const openConversation = useCallback(
        (conversationId) => {
            if (conversationId === activeIdRef.current) return;

            stopTyping();
            setActiveId(conversationId);
            if (userId) {
    const storageKey = `relay:activeConversation:${userId}`;

    if (conversationId) {
        localStorage.setItem(storageKey, conversationId);
    } else {
        localStorage.removeItem(storageKey);
    }
}
            setMessages([]);
            setMessagesStatus(conversationId ? "loading" : "idle");
            setReplyTo(null);
            setEditing(null);

            if (conversationId) {
                socketRef.current?.emit("joinConversation", conversationId);
            }
        },
       [stopTyping, userId]
    );

     useEffect(() => {
    if (conversationsStatus !== "ready" || !userId) return;

    const storageKey = `relay:activeConversation:${userId}`;
    const savedId = localStorage.getItem(storageKey);

    if (!savedId) return;

    const conversationExists = conversations.some(
        (conversation) => String(conversation._id) === savedId
    );

    if (conversationExists) {
        openConversation(savedId);
    } else {
        localStorage.removeItem(storageKey);
    }
}, [conversationsStatus, conversations, userId, openConversation]);
    const closeConversation = useCallback(
        () => openConversation(null),
        [openConversation]
    );

    // Opens (or creates) the one-to-one conversation with a searched user
    const startConversation = useCallback(
        async (otherUser) => {
            try {
                const conversation = await createConversation(otherUser._id);

                setConversations((previous) =>
                    previous.some((item) => item._id === conversation._id)
                        ? previous
                        : [{ ...conversation, unreadCount: 0 }, ...previous]
                );
                setConversationsStatus("ready");
                openConversation(conversation._id);

                return conversation;
            } catch (error) {
                toast.error(
                    getErrorMessage(error, "Couldn't open the conversation")
                );
                return null;
            }
        },
        [openConversation, toast]
    );

    // -------------------------------------------------------------- sending
    const markFailed = useCallback((clientId) => {
        setMessages((previous) =>
            previous.map((message) =>
                message.clientId === clientId && message.pending
                    ? { ...message, pending: false, failed: true }
                    : message
            )
        );
    }, []);

    const emitMessage = useCallback(
        (conversationId, payload, clientId) => {
            const current = socketRef.current;

            if (!current?.connected) {
                markFailed(clientId);
                toast.error("You're offline. Message not sent.");
                return;
            }

            current
                .timeout(15000)
                .emit(
                    "sendMessage",
                    { ...payload, conversationId, clientId },
                    (error, response) => {
                        if (error || response?.ok === false) {
                            markFailed(clientId);
                        }
                    }
                );
        },
        [markFailed, toast]
    );

    // text + optional File. Resolves true when the message was handed to the
    // socket (so the composer can clear itself).
    const sendMessage = useCallback(
        async ({ text = "", file = null, onProgress }) => {
            const conversationId = activeIdRef.current;
            const trimmed = text.trim();

            if (!conversationId || (!trimmed && !file)) return false;

            if (!socketRef.current?.connected) {
                toast.error("You're offline. Reconnecting…");
                return false;
            }

            let uploaded = null;

            if (file) {
                try {
                    const response = await uploadFile(file, onProgress);
                    uploaded = response.file;
                } catch (error) {
                    console.error("File upload failed:", error);
                    toast.error(getErrorMessage(error, "File upload failed"));
                    return false;
                }
            }

            const clientId = makeClientId();
            const payload = {
                text: trimmed,
                replyTo: replyTo?._id || null,
                fileUrl: uploaded?.url || null,
                fileName: uploaded?.name || null,
                fileType: uploaded?.type || null,
                fileSize: uploaded?.size || null
            };

            stopTyping();

            if (activeIdRef.current === conversationId) {
                setMessages((previous) => [
                    ...previous,
                    {
                        _id: `pending-${clientId}`,
                        clientId,
                        pending: true,
                        conversation: conversationId,
                        sender: {
                            _id: userIdRef.current,
                            name: user?.name,
                            email: user?.email,
                            profileImage: user?.profileImage
                        },
                        text: trimmed,
                        replyTo,
                        fileUrl: payload.fileUrl,
                        fileName: payload.fileName,
                        fileType: payload.fileType,
                        fileSize: payload.fileSize,
                        createdAt: new Date().toISOString(),
                        _payload: payload
                    }
                ]);
            }

            setReplyTo(null);
            emitMessage(conversationId, payload, clientId);

            return true;
        },
        [emitMessage, replyTo, stopTyping, toast, user]
    );

    const retryMessage = useCallback(
        (clientId) => {
            const failed = messages.find(
                (message) => message.clientId === clientId && message.failed
            );

            if (!failed) return;

            const newClientId = makeClientId();

            setMessages((previous) =>
                previous.map((message) =>
                    message.clientId === clientId
                        ? {
                              ...message,
                              _id: `pending-${newClientId}`,
                              clientId: newClientId,
                              pending: true,
                              failed: false
                          }
                        : message
                )
            );

            emitMessage(
                failed.conversation,
                failed._payload,
                newClientId
            );
        },
        [emitMessage, messages]
    );

    const discardMessage = useCallback((clientId) => {
        setMessages((previous) =>
            previous.filter((message) => message.clientId !== clientId)
        );
    }, []);

    // ---------------------------------------------------------- edit / delete
    const startReply = useCallback((message) => {
        if (!message?._id || message.pending) return;

        setReplyTo({
            _id: message._id,
            text: message.text,
            sender: message.sender,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileType: message.fileType,
            createdAt: message.createdAt
        });
        setEditing(null);
    }, []);

    const cancelReply = useCallback(() => setReplyTo(null), []);

    const startEditing = useCallback((message) => {
        if (!message?._id || message.pending) return;

        setEditing(message);
        setReplyTo(null);
    }, []);

    const cancelEditing = useCallback(() => setEditing(null), []);

    const editMessage = useCallback((messageId, text) => {
        const trimmed = text.trim();

        if (!messageId || !trimmed) return false;

        socketRef.current?.emit("editMessage", { messageId, text: trimmed });
        setEditing(null);

        return true;
    }, []);

    const deleteMessage = useCallback((messageId) => {
        if (!messageId) return;

        socketRef.current?.emit("deleteMessage", messageId);
    }, []);

    // ----------------------------------------------------- socket listeners
    // Registered ONCE per socket and removed on cleanup. They read the
    // latest state through refs, so they never need to be re-attached when
    // the user switches conversations.
    useEffect(() => {
        if (!socket) return;

        const clearTypingFor = (typingUserId) => {
            clearTimeout(typingTimers.current.get(typingUserId));
            typingTimers.current.delete(typingUserId);

            setTypingMap((previous) => {
                if (!previous[typingUserId]) return previous;

                const next = { ...previous };
                delete next[typingUserId];
                return next;
            });
        };

        const handlers = {
            connect: () => {
                socket.emit("getOnlineUsers");

                // After a reconnect, catch up on anything we missed
                if (hasConnectedBefore.current) {
                    loadConversations();

                    if (activeIdRef.current) {
                        fetchMessages(activeIdRef.current, { silent: true });
                    }
                }

                hasConnectedBefore.current = true;
            },

            onlineUsers: (ids) => {
                setOnlineIds(new Set(ids.map(String)));
                setPresenceReady(true);
            },

            userOnline: ({ userId: onlineId }) => {
                setOnlineIds((previous) =>
                    new Set(previous).add(String(onlineId))
                );
            },

            userOffline: ({ userId: offlineId, lastSeen }) => {
                const id = String(offlineId);

                setOnlineIds((previous) => {
                    const next = new Set(previous);
                    next.delete(id);
                    return next;
                });
                setLastSeenMap((previous) => ({ ...previous, [id]: lastSeen }));
                clearTypingFor(id);
            },

            userTyping: ({ userId: typingId, name }) => {
                const id = String(typingId);

                setTypingMap((previous) => ({
                    ...previous,
                    [id]: { name }
                }));

                clearTimeout(typingTimers.current.get(id));
                typingTimers.current.set(
                    id,
                    setTimeout(() => clearTypingFor(id), TYPING_TIMEOUT)
                );
            },

            userStoppedTyping: ({ userId: typingId }) =>
                clearTypingFor(String(typingId)),

            receiveMessage: (message) => {
                const conversationId = String(message.conversation);
                const senderId = idOf(message.sender);
                const isMine = senderId === userIdRef.current;
                const isActive = conversationId === activeIdRef.current;
                const isVisible = document.visibilityState === "visible";
                const readNow = isActive && isVisible;

                clearTypingFor(senderId);

                const known = conversationsRef.current.some(
                    (conversation) => conversation._id === conversationId
                );

                if (!known) {
                    // Message from a conversation we don't have yet
                    loadConversations();
                } else {
                    setConversations((previous) =>
                        sortConversations(
                            previous.map((conversation) =>
                                conversation._id === conversationId
                                    ? {
                                          ...conversation,
                                          lastMessage: message,
                                          updatedAt: message.createdAt,
                                          unreadCount:
                                              isMine || readNow
                                                  ? 0
                                                  : (conversation.unreadCount ||
                                                        0) + 1
                                      }
                                    : conversation
                            )
                        )
                    );
                }

                if (isActive) {
                    setMessages((previous) => {
                        if (
                            previous.some(
                                (item) => String(item._id) === String(message._id)
                            )
                        ) {
                            return previous;
                        }

                        // Replace our optimistic copy in place
                        const pendingIndex = message.clientId
                            ? previous.findIndex(
                                  (item) => item.clientId === message.clientId
                              )
                            : -1;

                        if (pendingIndex > -1) {
                            const next = [...previous];
                            next[pendingIndex] = message;
                            return next;
                        }

                        return [...previous, message];
                    });
                }

                if (!isMine && readNow) {
                    markRead(conversationId);
                }

                // Desktop notification for messages the user can't see
                if (
                    !isMine &&
                    !readNow &&
                    "Notification" in window &&
                    Notification.permission === "granted"
                ) {
                    const notification = new Notification(
                        message.sender?.name || "New message",
                        {
                            body: message.text || "📎 Sent a file",
                            icon: message.sender?.profileImage || undefined,
                            tag: conversationId
                        }
                    );

                    notification.onclick = () => {
                        window.focus();
                        openConversation(conversationId);
                        notification.close();
                    };
                }
            },

            messageDelivered: ({ messageId }) => {
                setMessages((previous) =>
                    previous.map((message) =>
                        String(message._id) === String(messageId)
                            ? { ...message, isDelivered: true }
                            : message
                    )
                );

                setConversations((previous) =>
                    previous.map((conversation) =>
                        String(conversation.lastMessage?._id) ===
                        String(messageId)
                            ? {
                                  ...conversation,
                                  lastMessage: {
                                      ...conversation.lastMessage,
                                      isDelivered: true
                                  }
                              }
                            : conversation
                    )
                );
            },

            messagesRead: ({ conversationId }) => {
                const id = String(conversationId);

                if (id === activeIdRef.current) {
                    setMessages((previous) =>
                        previous.map((message) =>
                            idOf(message.sender) === userIdRef.current
                                ? {
                                      ...message,
                                      isDelivered: true,
                                      isRead: true
                                  }
                                : message
                        )
                    );
                }

                setConversations((previous) =>
                    previous.map((conversation) =>
                        conversation._id === id &&
                        idOf(conversation.lastMessage?.sender) ===
                            userIdRef.current
                            ? {
                                  ...conversation,
                                  lastMessage: {
                                      ...conversation.lastMessage,
                                      isRead: true
                                  }
                              }
                            : conversation
                    )
                );
            },

            messageEdited: ({ messageId, conversationId, text, updatedAt }) => {
                if (String(conversationId) === activeIdRef.current) {
                    setMessages((previous) =>
                        previous.map((message) => {
                            if (String(message._id) === String(messageId)) {
                                return {
                                    ...message,
                                    text,
                                    isEdited: true,
                                    updatedAt
                                };
                            }

                            // Keep quoted previews in sync
                            if (
                                message.replyTo &&
                                String(message.replyTo._id) === String(messageId)
                            ) {
                                return {
                                    ...message,
                                    replyTo: {
                                        ...message.replyTo,
                                        text,
                                        isEdited: true
                                    }
                                };
                            }

                            return message;
                        })
                    );
                }

                setConversations((previous) =>
                    previous.map((conversation) =>
                        String(conversation.lastMessage?._id) ===
                        String(messageId)
                            ? {
                                  ...conversation,
                                  lastMessage: {
                                      ...conversation.lastMessage,
                                      text,
                                      isEdited: true
                                  }
                              }
                            : conversation
                    )
                );
            },

            messageDeleted: ({ messageId, conversationId }) => {
                if (String(conversationId) === activeIdRef.current) {
                    setMessages((previous) =>
                        previous.filter(
                            (message) =>
                                String(message._id) !== String(messageId)
                        )
                    );
                }

                const wasLastMessage = conversationsRef.current.some(
                    (conversation) =>
                        String(conversation.lastMessage?._id) ===
                        String(messageId)
                );

                // The server picked a new last message - fetch it
                if (wasLastMessage) loadConversations();
            },

            newConversation: (conversation) => {
                setConversations((previous) =>
                    previous.some((item) => item._id === conversation._id)
                        ? previous
                        : sortConversations([conversation, ...previous])
                );
                setConversationsStatus("ready");
            },

            profileUpdated: ({ userId: changedId, name, bio, profileImage }) => {
                const id = String(changedId);
                const patch = { name, bio, profileImage };

                setConversations((previous) =>
                    previous.map((conversation) => ({
                        ...conversation,
                        participants: conversation.participants.map(
                            (participant) =>
                                String(participant._id) === id
                                    ? { ...participant, ...patch }
                                    : participant
                        )
                    }))
                );

                setMessages((previous) =>
                    previous.map((message) =>
                        idOf(message.sender) === id &&
                        typeof message.sender === "object"
                            ? {
                                  ...message,
                                  sender: { ...message.sender, ...patch }
                              }
                            : message
                    )
                );

                // Same account open on another device
                if (id === userIdRef.current) updateUser(patch);
            },

            messageError: ({ message }) => toast.error(message),
            conversationError: ({ message }) => toast.error(message),


            "call:ice-candidate": async ({ conversationId, signal }) => {
    const currentCall = callRef.current;

    if (
        !currentCall ||
        String(currentCall.conversationId) !== String(conversationId) ||
        !signal
    ) {
        return;
    }

    try {
        const peerConnection = peerConnectionRef.current;

        // Queue candidates until the remote description is ready.
        if (!peerConnection || !peerConnection.remoteDescription) {
            pendingIceCandidatesRef.current.push(signal);
            return;
        }

        await peerConnection.addIceCandidate(
            new RTCIceCandidate(signal)
        );
    } catch (error) {
        console.error("Failed to add ICE candidate:", error);
    }
},
            "call:answer": async ({ conversationId, signal }) => {
    const currentCall = callRef.current;

    if (
        !currentCall ||
        currentCall.direction !== "outgoing" ||
        String(currentCall.conversationId) !== String(conversationId)
    ) {
        return;
    }

    try {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection || !signal) return;

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal)
        );

        // Add ICE candidates received before the answer.
        for (const candidate of pendingIceCandidatesRef.current) {
            await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        }

        pendingIceCandidatesRef.current = [];
    } catch (error) {
        console.error("Failed to handle call answer:", error);
        cleanupCall(true);
        toast.error("Couldn't connect the call.");
    }
},
            "call:offer": async ({ conversationId, signal }) => {
    const currentCall = callRef.current;

    if (
        !currentCall ||
        currentCall.direction !== "incoming" ||
        String(currentCall.conversationId) !== String(conversationId)
    ) {
        return;
    }

    try {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection || !signal) return;

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal)
        );

        // Add ICE candidates received before the offer.
        for (const candidate of pendingIceCandidatesRef.current) {
            await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
            );
        }

        pendingIceCandidatesRef.current = [];

        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        socket.emit("call:answer", {
            conversationId,
            signal: peerConnection.localDescription
        });
    } catch (error) {
        console.error("Failed to handle call offer:", error);
        cleanupCall(true);
        toast.error("Couldn't connect the call.");
    }
},
"call:ringing": ({ conversationId }) => {
    const currentCall = callRef.current;

    if (
        !currentCall ||
        currentCall.direction !== "outgoing" ||
        String(currentCall.conversationId) !== String(conversationId)
    ) {
        return;
    }

    setCall((previous) =>
        previous ? { ...previous, status: "ringing" } : previous
    );
},
            "call:response": async ({ conversationId, accepted }) => {
    const currentCall = callRef.current;

    if (
        !currentCall ||
        currentCall.direction !== "outgoing" ||
        String(currentCall.conversationId) !== String(conversationId)
    ) {
        return;
    }

    if (!accepted) {
        cleanupCall(false);
        toast.info("The call was declined.");
        return;
    }

    try {
        const peerConnection = createCallPeerConnection();

        if (!peerConnection) return;

        const offer = await peerConnection.createOffer();

        await peerConnection.setLocalDescription(offer);

        setCall((previous) =>
            previous ? { ...previous, status: "connecting" } : previous
        );

        socket.emit("call:offer", {
            conversationId,
            signal: peerConnection.localDescription
        });
    } catch (error) {
        console.error("Failed to create call offer:", error);
        cleanupCall(true);
        toast.error("Couldn't establish the call.");
    }
},
"call:ended": ({ conversationId }) => {
    const currentCall = callRef.current;

    if (
        !currentCall ||
        String(currentCall.conversationId) !== String(conversationId)
    ) {
        return;
    }

    cleanupCall(false);
    toast.info("The other participant ended the call.");
},
"call:incoming": ({ conversationId, type, caller }, ack) => {
    if (callRef.current) {
        socket.emit("call:response", {
            conversationId,
            accepted: false
        });
        return;
    }

    const ringtone = new Audio(
    "/sounds/freesound_community-ring-tone-68676.mp3"
);

ringtone.loop = true;
outgoingRingtoneRef.current = ringtone;

ringtone.play().catch((error) => {
    console.warn("Incoming ringtone playback was blocked:", error);
});

    const incomingCall = {
        conversationId,
        type,
        direction: "incoming",
        status: "incoming",
        otherUser: caller
    };

    callRef.current = incomingCall;
    setCall(incomingCall);
    ack?.({ received: true });

    // Show the device's default browser notification when the tab is hidden.
    if (
        document.visibilityState !== "visible" &&
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        const notification = new Notification(
            `Incoming ${type === "video" ? "video" : "voice"} call`,
            {
                body: `${caller?.name || "Someone"} is calling you`,
                icon: caller?.profileImage || undefined,
                tag: `call-${conversationId}`
            }
        );

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
},
        };

        Object.entries(handlers).forEach(([event, handler]) =>
            socket.on(event, handler)
        );

        // Socket may already be connected by the time we attach
        if (socket.connected) {
            socket.emit("getOnlineUsers");
            hasConnectedBefore.current = true;
        }

        const timers = typingTimers.current;

        return () => {
            Object.entries(handlers).forEach(([event, handler]) =>
                socket.off(event, handler)
            );

            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
        };
    }, [
        socket,
        loadConversations,
        fetchMessages,
        markRead,
        openConversation,
        toast,
        updateUser
    ]);

    // Mark the open conversation as read when the user returns to the tab
    useEffect(() => {
        const handleVisible = () => {
            if (document.visibilityState !== "visible") return;

            const conversationId = activeIdRef.current;

            if (!conversationId) return;

            const conversation = conversationsRef.current.find(
                (item) => item._id === conversationId
            );

            if (conversation?.unreadCount > 0) markRead(conversationId);
        };

        document.addEventListener("visibilitychange", handleVisible);
        window.addEventListener("focus", handleVisible);

        return () => {
            document.removeEventListener("visibilitychange", handleVisible);
            window.removeEventListener("focus", handleVisible);
        };
    }, [markRead]);

    // Ask for notification permission once (as the original app did)
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Total unread count in the tab title
    const totalUnread = useMemo(
        () =>
            conversations.reduce(
                (sum, conversation) => sum + (conversation.unreadCount || 0),
                0
            ),
        [conversations]
    );

    useEffect(() => {
        document.title =
            totalUnread > 0 ? `(${totalUnread}) ${APP_TITLE}` : APP_TITLE;

        return () => {
            document.title = APP_TITLE;
        };
    }, [totalUnread]);

    // ----------------------------------------------------------- derivations
    const getOtherUser = useCallback(
        (conversation) =>
            conversation?.participants?.find(
                (participant) => String(participant._id) !== userId
            ) || null,
        [userId]
    );

    const isOnline = useCallback(
        (person) => {
            if (!person) return false;

            return presenceReady
                ? onlineIds.has(String(person._id))
                : Boolean(person.isOnline);
        },
        [onlineIds, presenceReady]
    );

    const getLastSeen = useCallback(
        (person) =>
            person
                ? lastSeenMap[String(person._id)] || person.lastSeen || null
                : null,
        [lastSeenMap]
    );

    const isTyping = useCallback(
        (personId) => Boolean(typingMap[String(personId)]),
        [typingMap]
    );

    const activeConversation = useMemo(
        () =>
            conversations.find((conversation) => conversation._id === activeId) ||
            null,
        [conversations, activeId]
    );

    const otherUser = useMemo(
        () => getOtherUser(activeConversation),
        [getOtherUser, activeConversation]
    );

    const value = useMemo(
        () => ({
            currentUser: user,
            connectionStatus,
                    // Call state and controls
        call,
        localStream,
        remoteStream,
        muted,
        cameraOff,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,

            conversations,
            conversationsStatus,
            reloadConversations,

            activeId,
            activeConversation,
            otherUser,
            openConversation,
            closeConversation,
            startConversation,

            messages,
            messagesStatus,
            retryMessages,
            sendMessage,
            retryMessage,
            discardMessage,

            replyTo,
            startReply,
            cancelReply,
            editing,
            startEditing,
            cancelEditing,
            editMessage,
            deleteMessage,

            notifyTyping,
            stopTyping,

            getOtherUser,
            isOnline,
            getLastSeen,
            isTyping
        }),
        [
            user,
            connectionStatus,
            conversations,
            conversationsStatus,
            reloadConversations,
            activeId,
            activeConversation,
            otherUser,
            openConversation,
            closeConversation,
            startConversation,
            messages,
            messagesStatus,
            retryMessages,
            sendMessage,
            retryMessage,
            discardMessage,
            replyTo,
            startReply,
            cancelReply,
            editing,
            startEditing,
            cancelEditing,
            editMessage,
            deleteMessage,
            notifyTyping,
            stopTyping,
            getOtherUser,
            isOnline,
            getLastSeen,
            isTyping,
                        call,
            localStream,
            remoteStream,
            muted,
            cameraOff,
            startCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMute,
            toggleCamera,
        ]
    );

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
}
