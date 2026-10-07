const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const mongoose = require("mongoose");

const createConversation = async (req, res) => {
    try {
        const { userId } = req.body;

        const currentUserId = req.user._id;

        if (
            !userId ||
            !mongoose.isValidObjectId(userId)
        ) {
            return res.status(400).json({
                message: "A valid userId is required"
            });
        }

        if (String(userId) === String(currentUserId)) {
            return res.status(400).json({
                message:
                    "You cannot start a conversation with yourself"
            });
        }

        const io = req.app.get("io");

        // Put both users' live sockets into the conversation room
        const joinRooms = (conversationId) => {
            if (!io) {
                return;
            }

            io.in(`user:${currentUserId}`)
                .socketsJoin(String(conversationId));

            io.in(`user:${userId}`)
                .socketsJoin(String(conversationId));
        };

        let conversation = await Conversation.findOne({
            participants: {
                $all: [currentUserId, userId],
                $size: 2
            }
        }).populate(
            "participants",
            "-password"
        );

        if (conversation) {
            joinRooms(conversation._id);

            return res.status(200).json(conversation);
        }

        conversation = await Conversation.create({
            participants: [currentUserId, userId]
        });

        conversation = await conversation.populate(
            "participants",
            "-password"
        );

        joinRooms(conversation._id);

        // Tell the other user a conversation now exists
        if (io) {
            io.to(`user:${userId}`).emit(
                "newConversation",
                {
                    ...conversation.toObject(),
                    unreadCount: 0
                }
            );
        }

        res.status(201).json(conversation);

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user._id
        })
            .populate("participants", "-password")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        // Add unread message count
        const conversationsWithUnreadCount =
            await Promise.all(
                conversations.map(async (conversation) => {

                    const unreadCount =
                        await Message.countDocuments({
                            conversation:
                                conversation._id,

                            sender: {
                                $ne: req.user._id
                            },

                            isRead: false
                        });

                    return {
                        ...conversation.toObject(),
                        unreadCount
                    };
                })
            );

        res.status(200).json(
            conversationsWithUnreadCount
        );

    } catch (error) {
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    createConversation,
    getConversations
};