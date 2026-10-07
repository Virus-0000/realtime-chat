const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const sendMessage = async (req, res) => {
    try {
        const {
            conversationId,
            text,
            replyTo
        } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                message:
                    "Message cannot be empty"
            });
        }

        const conversation =
            await Conversation.findById(
                conversationId
            );

        if (!conversation) {
            return res.status(404).json({
                message:
                    "Conversation not found"
            });
        }

        const isParticipant =
            conversation.participants.some(
                (participant) =>
                    String(participant) ===
                    String(req.user._id)
            );

        if (!isParticipant) {
            return res.status(403).json({
                message:
                    "You are not a participant in this conversation"
            });
        }

        let validReplyTo = null;

        if (replyTo) {
            const repliedMessage =
                await Message.findOne({
                    _id: replyTo,
                    conversation:
                        conversationId
                });

            if (!repliedMessage) {
                return res.status(404).json({
                    message:
                        "Reply message not found"
                });
            }

            validReplyTo =
                repliedMessage._id;
        }

        const message =
            await Message.create({
                conversation:
                    conversationId,
                sender:
                    req.user._id,
                text:
                    text.trim(),
                replyTo:
                    validReplyTo
            });

        conversation.lastMessage =
            message._id;

        await conversation.save();

        const populatedMessage =
            await Message.findById(
                message._id
            )
                .populate(
    "sender",
    "name email profileImage"
)
                .populate(
                    "replyTo",
                    "text sender createdAt isEdited fileUrl fileName fileType"
                );

        res.status(201).json(
            populatedMessage
        );
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getMessages = async (req, res) => {
    try {
        const { conversationId } =
            req.params;

        const conversation =
            await Conversation.findOne({
                _id: conversationId,
                participants:
                    req.user._id
            });

        if (!conversation) {
            return res.status(403).json({
                message:
                    "You are not a participant in this conversation"
            });
        }

        const messages =
            await Message.find({
                conversation:
                    conversationId
            })
               .populate(
    "sender",
    "name email profileImage"
)
                .populate(
                    "replyTo",
                    "text sender createdAt isEdited fileUrl fileName fileType"
                )
                .sort({
                    createdAt: 1
                });

        res.status(200).json(
            messages
        );
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const markMessagesAsRead = async (
    req,
    res
) => {
    try {
        const { conversationId } =
            req.params;

        const conversation =
            await Conversation.findOne({
                _id: conversationId,
                participants:
                    req.user._id
            });

        if (!conversation) {
            return res.status(403).json({
                message:
                    "You are not a participant in this conversation"
            });
        }

        await Message.updateMany(
            {
                conversation:
                    conversationId,
                sender: {
                    $ne:
                        req.user._id
                },
                isRead: false
            },
            {
                $set: {
                    isRead: true
                }
            }
        );

        res.status(200).json({
            message:
                "Messages marked as read"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const deleteMessage = async (
    req,
    res
) => {
    try {
        const { messageId } =
            req.params;

        const message =
            await Message.findById(
                messageId
            );

        if (!message) {
            return res.status(404).json({
                message:
                    "Message not found"
            });
        }

        if (
            String(message.sender) !==
            String(req.user._id)
        ) {
            return res.status(403).json({
                message:
                    "You can only delete your own messages"
            });
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
                await Message.findOne({
                    conversation:
                        conversationId
                }).sort({
                    createdAt: -1
                });

            conversation.lastMessage =
                latestMessage
                    ? latestMessage._id
                    : null;

            await conversation.save();
        }

        res.status(200).json({
            message:
                "Message deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const editMessage = async (
    req,
    res
) => {
    try {
        const { messageId } =
            req.params;

        const { text } =
            req.body;

        if (
            !text ||
            !text.trim()
        ) {
            return res.status(400).json({
                message:
                    "Message text cannot be empty"
            });
        }

        const message =
            await Message.findById(
                messageId
            );

        if (!message) {
            return res.status(404).json({
                message:
                    "Message not found"
            });
        }

        if (
            String(message.sender) !==
            String(req.user._id)
        ) {
            return res.status(403).json({
                message:
                    "You can only edit your own messages"
            });
        }

        message.text =
            text.trim();

        message.isEdited =
            true;

        await message.save();

        const populatedMessage =
            await Message.findById(
                message._id
            )
              .populate(
    "sender",
    "name email profileImage"
)
                .populate(
                    "replyTo",
                    "text sender createdAt isEdited fileUrl fileName fileType"
                );

        res.status(200).json({
            message:
                "Message edited successfully",
            data:
                populatedMessage
        });
    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    markMessagesAsRead,
    deleteMessage,
    editMessage
};