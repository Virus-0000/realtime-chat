const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        text: {
            type: String,
            default: "",
            trim: true
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },

        fileUrl: {
            type: String,
            default: null
        },

        fileName: {
            type: String,
            default: null
        },

        fileType: {
            type: String,
            default: null
        },

        fileSize: {
            type: Number,
            default: null
        },

        isDelivered: {
            type: Boolean,
            default: false
        },

        isRead: {
            type: Boolean,
            default: false
        },

        isEdited: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Message = mongoose.model(
    "Message",
    messageSchema
);

module.exports = Message;