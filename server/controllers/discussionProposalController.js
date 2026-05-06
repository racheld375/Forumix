const DiscussionProposal = require("../models/DiscussionProposal");
const Discussion = require("../models/Discussions");
const Category = require("../models/Categorys");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/Users");

async function sendAdminDecisionMessage(req, userId, content) {
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, userId] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, userId]
    });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user.id,
    content,
    readBy: [req.user.id]
  });

  await Conversation.findByIdAndUpdate(conversation._id, {
    lastMessage: message._id
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username");

  const io = req.app.get("socketio");
  if (io) {
    io.to(userId.toString()).emit("receiveMessage", populatedMessage);
  }
}

exports.createProposal = async (req, res) => {
  try {
    const { title, note, category } = req.body;

    if (!title || !note || !category) {
      return res.status(400).json({ error: "חובה למלא שם דיון, הערה וקטגוריה" });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ error: "קטגוריה לא נמצאה" });
    }

    const proposal = await DiscussionProposal.create({
      title,
      note,
      category,
      requester: req.user.id
    });

    const populatedProposal = await DiscussionProposal.findById(proposal._id)
      .populate("category", "title")
      .populate("requester", "username city role");

    const io = req.app.get("socketio");
    if (io) {
      const admins = await User.find({ role: "admin" }).select("_id");
      admins.forEach((admin) => {
        io.to(admin._id.toString()).emit("discussionProposalCreated", populatedProposal);
      });
    }

    res.status(201).json(populatedProposal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליחת הצעת הדיון" });
  }
};

exports.getPendingProposals = async (req, res) => {
  try {
    const proposals = await DiscussionProposal.find({ status: "pending" })
      .populate("category", "title")
      .populate("requester", "username city role")
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת הצעות דיון" });
  }
};

exports.approveProposal = async (req, res) => {
  try {
    const proposal = await DiscussionProposal.findById(req.params.id)
      .populate("category", "title")
      .populate("requester", "username");

    if (!proposal) {
      return res.status(404).json({ error: "הצעת דיון לא נמצאה" });
    }

    if (proposal.status !== "pending") {
      return res.status(400).json({ error: "ההצעה כבר טופלה" });
    }

    const discussion = await Discussion.create({
      title: proposal.title,
      topic: proposal.title,
      creator: proposal.requester._id,
      category: proposal.category._id
    });

    await Category.findByIdAndUpdate(proposal.category._id, {
      $push: { discussions: discussion._id }
    });

    proposal.status = "approved";
    await proposal.save();

    await sendAdminDecisionMessage(
      req,
      proposal.requester._id,
      `הצעת הדיון שלך "${proposal.title}" אושרה ונוספה לקטגוריה ${proposal.category.title}.`
    );

    const io = req.app.get("socketio");
    if (io) {
      io.emit("discussionApproved", {
        categoryId: proposal.category._id.toString(),
        discussionId: discussion._id.toString()
      });
    }

    await DiscussionProposal.findByIdAndDelete(proposal._id);

    res.json({ message: "הצעת הדיון אושרה", discussion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה באישור הצעת הדיון" });
  }
};

exports.rejectProposal = async (req, res) => {
  try {
    const proposal = await DiscussionProposal.findById(req.params.id)
      .populate("category", "title")
      .populate("requester", "username");

    if (!proposal) {
      return res.status(404).json({ error: "הצעת דיון לא נמצאה" });
    }

    await sendAdminDecisionMessage(
      req,
      proposal.requester._id,
      `הצעת הדיון שלך "${proposal.title}" לא אושרה על ידי מנהל.`
    );

    await DiscussionProposal.findByIdAndDelete(proposal._id);

    res.json({ message: "הצעת הדיון נמחקה" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה במחיקת הצעת הדיון" });
  }
};
