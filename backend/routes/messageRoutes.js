const express = require("express");

const {
    sendMessage,
    getMessages,
    markMessagesAsRead,
    deleteMessage,
    editMessage
} = require("../controllers/messageController");

const protect =
    require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    protect,
    sendMessage
);

router.get(
    "/:conversationId",
    protect,
    getMessages
);

router.patch(
    "/read/:conversationId",
    protect,
    markMessagesAsRead
);

router.delete(
    "/:messageId",
    protect,
    deleteMessage
);

router.patch(
    "/:messageId",
    protect,
    editMessage
);

module.exports = router;