const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// יצירת שיחה או מציאת קיימת
exports.getOrCreateConversation = async (req, res) => {
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
};


// שליחת הודעה
exports.sendMessage = async (req, res) => {
  const { conversationId, content } = req.body;
  const io = req.app.get("socketio");

  const message = await Message.create({
    conversation: conversationId,
    sender: req.user.id,
    content,
    readBy: [req.user.id]
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id
  });

  const conversation = await Conversation.findById(conversationId);

  if (conversation) {
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== req.user.id
    );

    if (receiverId) {
      io.to(receiverId.toString()).emit("receiveMessage", message);
    }
  }

  res.status(201).json(message);
};


// שליפת הודעות לשיחה
exports.getMessages = async (req, res) => {
  const messages = await Message.find({
    conversation: req.params.conversationId
  })
  .populate("sender", "username")
  .sort({ createdAt: 1 });

  res.json(messages);
};


// רשימת שיחות של המשתמש
exports.getMyConversations = async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user.id
  })
    .populate("participants", "username")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  res.json(conversations);
};


// ספירת unread
exports.getUnreadCount = async (req, res) => {
  const count = await Message.countDocuments({
    readBy: { $ne: req.user.id }
  });

  res.json({ count });
};

