const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// יצירת שיחה או מציאת שיחה קיימת
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, userId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, userId]
      });
    }

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה ביצירת שיחה" });
  }
};

// שליחת הודעה
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    const createdMessage = await Message.create({
      conversation: conversationId,
      sender: req.user.id,
      content,
      readBy: [req.user.id]
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: createdMessage._id
    });

    const conversation = await Conversation.findById(conversationId);
    const message = await Message.findById(createdMessage._id)
      .populate("sender", "username");

    const receiverId = conversation?.participants.find(
      (participant) => participant.toString() !== req.user.id
    );

    const io = req.app.get("socketio");
    if (io && receiverId) {
      io.to(receiverId.toString()).emit("receiveMessage", message);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליחת הודעה" });
  }
};

// שליפת הודעות לשיחה
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversation: req.params.conversationId
    })
      .populate("sender", "username")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת הודעות" });
  }
};

// רשימת שיחות של המשתמש
exports.getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate("participants", "username")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user.id },
          readBy: { $ne: req.user.id }
        });

        return {
          ...conversation.toObject(),
          unreadCount
        };
      })
    );

    res.json(conversationsWithUnread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת שיחות" });
  }
};

// ספירת הודעות שלא נקראו
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      sender: { $ne: req.user.id },
      readBy: { $ne: req.user.id }
    });

    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בספירת הודעות שלא נקראו" });
  }
};
