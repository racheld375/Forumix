const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { authMiddleware } = require("../conpig/authMiddleware");

// רשימת שיחות שלי
router.get("/", authMiddleware, chatController.getMyConversations);

// יצירת/שליפת שיחה
router.post("/conversation", authMiddleware, chatController.getOrCreateConversation);

// שליחת הודעה
router.post("/message", authMiddleware, chatController.sendMessage);


// ספירת לא נקראו
router.get("/unread/count", authMiddleware, chatController.getUnreadCount);
// שליפת הודעות לשיחה
router.get("/:conversationId", authMiddleware, chatController.getMessages);

module.exports = router;