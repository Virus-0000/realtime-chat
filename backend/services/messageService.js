const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const createMessage = async (
    conversationId,
    senderId,
    text = "",
    replyTo = null,
    fileUrl = null,
    fileName = null,
    fileType = null,
    fileSize = null
) => {
    const conversation =
        await Conversation.findById(
            conversationId
        );

    if (!conversation) {
        throw new Error(
            "Conversation not found"
        );
    }

    // Validate reply message
    let validReplyTo = null;

    if (replyTo) {
        const repliedMessage =
            await Message.findOne({
                _id: replyTo,
                conversation:
                    conversationId
            });

        if (!repliedMessage) {
            throw new Error(
                "Reply message not found"
            );
        }

        validReplyTo =
            repliedMessage._id;
    }

    // Message must contain either text or a file
    if (
        !text?.trim() &&
        !fileUrl
    ) {
        throw new Error(
            "Message cannot be empty"
        );
    }

    // Create message
    const message =
        await Message.create({
            conversation:
                conversationId,

            sender:
                senderId,

            text:
                text?.trim() || "",

            replyTo:
                validReplyTo,

            fileUrl:
                fileUrl || null,

            fileName:
                fileName || null,

            fileType:
                fileType || null,

            fileSize:
                fileSize || null
        });

    // Update conversation's last message
    conversation.lastMessage =
        message._id;

    await conversation.save();

    // Populate sender and reply information
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

    return populatedMessage;
};

module.exports = {
    createMessage
};