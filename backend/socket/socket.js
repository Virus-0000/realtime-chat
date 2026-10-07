const {
    createMessage
} = require("../services/messageService");

const socketAuth =
    require("./socketAuth");

const Conversation =
    require("../models/Conversation");

const Message =
    require("../models/Message");

const User =
    require("../models/User");


// userId -> Set of socket ids. A user is "online" while at least one
// of their sockets (tabs / devices) is connected.
const onlineSockets = new Map();

const getOnlineUserIds = () =>
    Array.from(onlineSockets.keys());


const setupSocket = (io) => {

    io.use(socketAuth);


    io.on(
        "connection",
        (socket) => {

            console.log(
                "Authenticated socket connected:",
                socket.id
            );

            console.log(
                "User ID:",
                socket.user._id
            );


     

            const userId =
                String(socket.user._id);

            // Personal room (used for events that target one user,
            // e.g. a brand-new conversation started by someone else)
            socket.join(`user:${userId}`);

            // Join every existing conversation room so messages for
            // conversations that are not currently open are still received.
            Conversation.find({
                participants:
                    socket.user._id
            })
                .select("_id")
                .then((conversations) => {
                    conversations.forEach(
                        (conversation) => {
                            socket.join(
                                String(
                                    conversation._id
                                )
                            );
                        }
                    );
                })
                .catch((error) => {
                    console.error(
                        "Auto-join conversations error:",
                        error.message
                    );
                });

            // Presence
            const existingSockets =
                onlineSockets.get(userId) ||
                new Set();

            const isFirstConnection =
                existingSockets.size === 0;

            existingSockets.add(socket.id);

            onlineSockets.set(
                userId,
                existingSockets
            );

            // Send the connecting client the authoritative list of
            // users that are online right now.
            socket.emit(
                "onlineUsers",
                getOnlineUserIds()
            );

            socket.on(
                "getOnlineUsers",
                () => {
                    socket.emit(
                        "onlineUsers",
                        getOnlineUserIds()
                    );
                }
            );

            if (isFirstConnection) {

                User.updateOne(
                    {
                        _id:
                            socket.user._id
                    },
                    {
                        $set: {
                            isOnline:
                                true,

                            lastSeen:
                                null
                        }
                    }
                ).catch((error) => {
                    console.error(
                        "Failed to update online status:",
                        error.message
                    );
                });

                io.emit(
                    "userOnline",
                    {
                        userId:
                            socket.user._id
                    }
                );

            }


            socket.on(
                "joinConversation",
                async (
                    conversationId
                ) => {

                    try {

                        const conversation =
                            await Conversation.findOne(
                                {
                                    _id:
                                        conversationId,

                                    participants:
                                        socket.user._id
                                }
                            );


                        if (!conversation) {

                            return socket.emit(
                                "conversationError",
                                {
                                    message:
                                        "You are not a participant in this conversation"
                                }
                            );

                        }


                        socket.join(
                            conversationId
                        );


                        console.log(
                            `Socket ${socket.id} joined conversation ${conversationId}`
                        );

                    } catch (error) {

                        console.error(
                            "Join conversation error:",
                            error.message
                        );


                        socket.emit(
                            "conversationError",
                            {
                                message:
                                    "Unable to join conversation"
                            }
                        );

                    }

                }
            );



            socket.on(
                "typing",
                async (
                    conversationId
                ) => {

                    try {

                        const conversation =
                            await Conversation.findOne(
                                {
                                    _id:
                                        conversationId,

                                    participants:
                                        socket.user._id
                                }
                            );


                        if (!conversation) {
                            return;
                        }


                        socket
                            .to(
                                conversationId
                            )
                            .emit(
                                "userTyping",
                                {
                                    userId:
                                        socket.user._id,

                                    name:
                                        socket.user.name
                                }
                            );

                    } catch (error) {

                        console.error(
                            "Typing error:",
                            error.message
                        );

                    }

                }
            );

        

            socket.on(
                "stopTyping",
                async (
                    conversationId
                ) => {

                    try {

                        const conversation =
                            await Conversation.findOne(
                                {
                                    _id:
                                        conversationId,

                                    participants:
                                        socket.user._id
                                }
                            );


                        if (!conversation) {
                            return;
                        }


                        socket
                            .to(
                                conversationId
                            )
                            .emit(
                                "userStoppedTyping",
                                {
                                    userId:
                                        socket.user._id
                                }
                            );

                    } catch (error) {

                        console.error(
                            "Stop typing error:",
                            error.message
                        );

                    }

                }
            );


       

            socket.on(
                "markMessagesRead",
                async (
                    conversationId
                ) => {

                    try {

                        const conversation =
                            await Conversation.findOne(
                                {
                                    _id:
                                        conversationId,

                                    participants:
                                        socket.user._id
                                }
                            );


                        if (!conversation) {

                            return socket.emit(
                                "conversationError",
                                {
                                    message:
                                        "You are not a participant in this conversation"
                                }
                            );

                        }


                        const result =
                            await Message.updateMany(
                                {
                                    conversation:
                                        conversationId,

                                    sender: {
                                        $ne:
                                            socket.user._id
                                    },

                                    isRead:
                                        false
                                },
                                {
                                    $set: {
                                        isRead:
                                            true
                                    }
                                }
                            );


                        socket
                            .to(
                                conversationId
                            )
                            .emit(
                                "messagesRead",
                                {
                                    conversationId:
                                        conversationId,

                                    userId:
                                        socket.user._id,

                                    modifiedCount:
                                        result.modifiedCount
                                }
                            );

                    } catch (error) {

                        console.error(
                            "Mark messages as read error:",
                            error.message
                        );


                        socket.emit(
                            "messageError",
                            {
                                message:
                                    "Failed to mark messages as read"
                            }
                        );

                    }

                }
            );


         
           socket.on(
    "sendMessage",
    async (data, ack) => {
        const respond = (payload) => {
            if (typeof ack === "function") {
                ack(payload);
            }
        };

        try {
            const {
                conversationId,
                text,
                replyTo,
                fileUrl,
                fileName,
                fileType,
                fileSize,
                clientId
            } = data;

            // Message must contain either text or a file
            if (
                (!text || !text.trim()) &&
                !fileUrl
            ) {
                respond({
                    ok: false,
                    error: "Message cannot be empty"
                });

                return socket.emit(
                    "messageError",
                    {
                        message:
                            "Message cannot be empty"
                    }
                );
            }

            const conversation =
                await Conversation.findOne({
                    _id:
                        conversationId,
                    participants:
                        socket.user._id
                });

            if (!conversation) {
                respond({
                    ok: false,
                    error: "You are not a participant in this conversation"
                });

                return socket.emit(
                    "messageError",
                    {
                        message:
                            "You are not a participant in this conversation"
                    }
                );
            }

            const message =
                await createMessage(
                    conversationId,
                    socket.user._id,
                    text
                        ? text.trim()
                        : "",
                    replyTo || null,
                    fileUrl || null,
                    fileName || null,
                    fileType || null,
                    fileSize || null
                );

            socket
                .to(conversationId)
                .emit(
                    "userStoppedTyping",
                    {
                        userId:
                            socket.user._id
                    }
                );

            // clientId (optional) lets the sender match its optimistic
            // message with the saved one.
            const payload =
                message.toJSON();

            if (clientId) {
                payload.clientId =
                    clientId;
            }

            io.to(
                conversationId
            ).emit(
                "receiveMessage",
                payload
            );

            await Message.findByIdAndUpdate(
                message._id,
                {
                    $set: {
                        isDelivered:
                            true
                    }
                }
            );

            io.to(
                conversationId
            ).emit(
                "messageDelivered",
                {
                    messageId:
                        message._id,
                    conversationId:
                        conversationId
                }
            );

            console.log(
                "Message saved:",
                message._id
            );

            respond({
                ok: true,
                messageId: message._id
            });
        } catch (error) {
            console.error(
                "Message error:",
                error.message
            );

            respond({
                ok: false,
                error: error.message
            });

            socket.emit(
                "messageError",
                {
                    message:
                        error.message
                }
            );
        }
    }
);


            // =========================
            // EDIT MESSAGE
            // =========================

            socket.on(
                "editMessage",
                async (
                    data
                ) => {

                    try {

                        const {
                            messageId,
                            text
                        } = data;


                        if (
                            !text ||
                            !text.trim()
                        ) {

                            return socket.emit(
                                "messageError",
                                {
                                    message:
                                        "Message text cannot be empty"
                                }
                            );

                        }


                        const message =
                            await Message.findById(
                                messageId
                            );


                        if (!message) {

                            return socket.emit(
                                "messageError",
                                {
                                    message:
                                        "Message not found"
                                }
                            );

                        }


                        if (
                            String(
                                message.sender
                            ) !==
                            String(
                                socket.user._id
                            )
                        ) {

                            return socket.emit(
                                "messageError",
                                {
                                    message:
                                        "You can only edit your own messages"
                                }
                            );

                        }


                        const conversationId =
                            message.conversation;


                        message.text =
                            text.trim();


                        message.isEdited =
                            true;


                        await message.save();


                        io.to(
                            String(
                                conversationId
                            )
                        ).emit(
                            "messageEdited",
                            {
                                messageId:
                                    message._id,

                                conversationId:
                                    String(
                                        conversationId
                                    ),

                                text:
                                    message.text,

                                isEdited:
                                    true,

                                updatedAt:
                                    message.updatedAt
                            }
                        );

                    } catch (error) {

                        console.error(
                            "Edit message error:",
                            error.message
                        );


                        socket.emit(
                            "messageError",
                            {
                                message:
                                    "Failed to edit message"
                            }
                        );

                    }

                }
            );


            // =========================
            // DELETE MESSAGE
            // =========================

            socket.on(
                "deleteMessage",
                async (
                    messageId
                ) => {

                    try {

                        const message =
                            await Message.findById(
                                messageId
                            );


                        if (!message) {

                            return socket.emit(
                                "messageError",
                                {
                                    message:
                                        "Message not found"
                                }
                            );

                        }


                        if (
                            String(
                                message.sender
                            ) !==
                            String(
                                socket.user._id
                            )
                        ) {

                            return socket.emit(
                                "messageError",
                                {
                                    message:
                                        "You can only delete your own messages"
                                }
                            );

                        }


                        const conversationId =
                            message.conversation;


                        await Message.findByIdAndDelete(
                            messageId
                        );


                        const conversation =
                            await Conversation.findById(
                                conversationId
                            );


                        if (conversation) {

                            const latestMessage =
                                await Message.findOne(
                                    {
                                        conversation:
                                            conversationId
                                    }
                                ).sort({
                                    createdAt:
                                        -1
                                });


                            conversation.lastMessage =
                                latestMessage
                                    ? latestMessage._id
                                    : null;


                            await conversation.save();

                        }


                        io.to(
                            String(
                                conversationId
                            )
                        ).emit(
                            "messageDeleted",
                            {
                                messageId:
                                    messageId,

                                conversationId:
                                    String(
                                        conversationId
                                    )
                            }
                        );

                    } catch (error) {

                        console.error(
                            "Delete message error:",
                            error.message
                        );


                        socket.emit(
                            "messageError",
                            {
                                message:
                                    "Failed to delete message"
                            }
                        );

                    }

                }
            );


            // =========================
            // DISCONNECT
            // =========================

            socket.on(
                "disconnect",
                async () => {

                    try {

                        const userSockets =
                            onlineSockets.get(
                                userId
                            );

                        if (userSockets) {
                            userSockets.delete(
                                socket.id
                            );
                        }

                        // Another tab/device is still connected
                        if (
                            userSockets &&
                            userSockets.size > 0
                        ) {
                            return;
                        }

                        onlineSockets.delete(
                            userId
                        );

                        const lastSeen =
                            new Date();

                        await User.updateOne(
                            {
                                _id:
                                    socket.user._id
                            },
                            {
                                $set: {
                                    isOnline:
                                        false,

                                    lastSeen
                                }
                            }
                        );


                        io.emit(
                            "userOffline",
                            {
                                userId:
                                    socket.user._id,

                                lastSeen
                            }
                        );


                        console.log(
                            "Authenticated socket disconnected:",
                            socket.id
                        );

                    } catch (error) {

                        console.error(
                            "Failed to update offline status:",
                            error.message
                        );

                    }

                }
            );

        }
    );

};


module.exports = setupSocket;