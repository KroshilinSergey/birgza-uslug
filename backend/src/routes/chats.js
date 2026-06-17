const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.get("/my", protect, chatController.getMyChats);
router.get("/order/:orderId", protect, chatController.getOrCreateChat);
router.get("/:chatId/messages", protect, chatController.getMessages);
router.post("/:chatId/messages", protect, chatController.sendMessage);
router.post("/:chatId/read", protect, chatController.markAsRead);

module.exports = router;
