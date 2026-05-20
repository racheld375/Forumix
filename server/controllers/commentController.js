
// יצירה, עדכון, מחיקה

// שליפת כל התגובות

// שליפת תגובות לפי דיון, קטגוריה, משתמש

// שליפת 10 התגובות האחרונות

// const mongoose = require("mongoose");
// const Comment = require("../models/Comments");
// const Discussion = require("../models/Discussions");
// const Category = require("../models/Categorys");
// const User = require("../models/Users");

const mongoose = require("mongoose");
const Comment = require("../models/Comments");
const Discussion = require("../models/Discussions");
const User = require("../models/Users");
const Category = require("../models/Categorys");

exports.createComment = async (req, res) => {
  
  try {
    console.log("USER:", req.user);
    console.log("BODY:", req.body);
    const { content, discussion } = req.body;
    const userId = req.user.id; // 👈 מגיע מה־token

    // בדיקה שכל השדות קיימים
    if (!content || !discussion) {
      return res.status(400).json({ error: "חובה למלא: content, discussion" });
    }

    // בדיקה שהמזהים חוקיים
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "מזהה משתמש לא חוקי" });
    }

    if (!mongoose.Types.ObjectId.isValid(discussion)) {
      return res.status(400).json({ error: "מזהה דיון לא חוקי" });
    }

    // בדיקה שהמשתמש קיים
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "משתמש לא נמצא" });
    }

    // בדיקה שהדיון קיים
    const discussionExists = await Discussion.findById(discussion);
    if (!discussionExists) {
      return res.status(404).json({ error: "דיון לא נמצא" });
    }

    // יצירת תגובה חדשה
    const newComment = new Comment({
      content,
      user: userId,
      discussion
    });

    await newComment.save();

    // עדכון המשתמש
    if (!Array.isArray(userExists.comments)) userExists.comments = [];
    userExists.comments.push(newComment._id);
    await userExists.save();

    // עדכון הדיון
    await Discussion.updateOne(
      { _id: discussion },
      { $push: { comments: newComment._id } }
    );

    const populatedComment = await Comment.findById(newComment._id)
  .populate("user", "username");

res.status(201).json({ comment: populatedComment });

  } catch (err) {
    console.error("שגיאה ב-createComment:", err);
    res.status(500).json({
      error: "שגיאה ביצירת התגובה",
      details: err.message
    });
  }
};
// ========================
// יצירת תגובה חדשה
// ========================
// exports.createComment = async (req, res) => {
//   try {
//     const { content, user, discussion } = req.body;

//     // בדיקות תקינות
//     if (!content || !user || !discussion) {
//       return res.status(400).json({ error: "חובה למלא: content, user, discussion" });
//     }

//     // בדיקה שהמשתמש קיים
//     const userExists = await User.findById(user);
//     if (!userExists) return res.status(404).json({ error: "משתמש לא נמצא" });

//     // בדיקה שהדיון קיים
//     const discussionExists = await Discussion.findById(discussion);
//     if (!discussionExists) return res.status(404).json({ error: "דיון לא נמצא" });

//     const newComment = new Comment({ content, user, discussion });
//     await newComment.save();

//     // הוספת התגובה למערך התגובות של המשתמש והדיון
//     userExists.comments.push(newComment._id);
//     await userExists.save();

//     discussionExists.comments.push(newComment._id);
//     await discussionExists.save();

//     res.status(201).json(newComment);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "שגיאה ביצירת התגובה", details: err.message });
// }
// };

// ========================
// עדכון תגובה לפי ID
// ========================
exports.updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "חובה למלא content לעדכון" });

    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true, runValidators: true }
    );

    if (!updatedComment) return res.status(404).json({ error: "תגובה לא נמצאה" });

    res.json(updatedComment);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בעדכון התגובה" });
  }
};

// ========================
// מחיקת תגובה לפי ID
// ========================
exports.deleteComment = async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);
    if (!deletedComment) return res.status(404).json({ error: "תגובה לא נמצאה" });

    // הסרת מזהה התגובה ממערכים של המשתמש והדיון
    await User.findByIdAndUpdate(deletedComment.user, { $pull: { comments: deletedComment._id } });
    await Discussion.findByIdAndUpdate(deletedComment.discussion, { $pull: { comments: deletedComment._id } });

    res.json({ message: "תגובה נמחקה בהצלחה" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה במחיקת התגובה" });
  }
};

// ========================
// שליפת כל התגובות
// ========================
exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("user", "username city")
      .populate("discussion", "topic");
    res.json({ comments: comments || [] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת התגובות" });
  
  }
};

exports.getCommentsByCategoryStats = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    const match = {};

    if (period !== "all") {
      const days = Number.parseInt(period, 10);

      if (Number.isNaN(days) || days <= 0) {
        return res.status(400).json({ error: "תקופה לא תקינה" });
      }

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      match.createdAt = { $gte: fromDate };
    }

    const categories = await Category.find().select("title").sort({ title: 1 });
    const countsByCategory = new Map(
      categories.map((category) => [
        category._id.toString(),
        {
          categoryId: category._id,
          categoryTitle: category.title,
          commentsCount: 0
        }
      ])
    );

    const comments = await Comment.find(match)
      .select("discussion")
      .populate({
        path: "discussion",
        select: "category",
        populate: { path: "category", select: "title" }
      });

    comments.forEach((comment) => {
      const category = comment.discussion?.category;
      const categoryId = category?._id?.toString();

      if (!categoryId) return;

      if (!countsByCategory.has(categoryId)) {
        countsByCategory.set(categoryId, {
          categoryId: category._id,
          categoryTitle: category.title || "ללא קטגוריה",
          commentsCount: 0
        });
      }

      countsByCategory.get(categoryId).commentsCount += 1;
    });

    const stats = [...countsByCategory.values()]
      .sort((a, b) => b.commentsCount - a.commentsCount || a.categoryTitle.localeCompare(b.categoryTitle));

    res.json({
      period,
      totalComments: comments.length,
      stats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת נתוני גרפים" });
  }
};

// ========================
// שליפת תגובות לפי דיון (Discussion ID)
// ========================
exports.getCommentsByDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId);
    if (!discussion) return res.status(404).json({ error: "דיון לא נמצא" });

    const comments = await Comment.find({ discussion: discussion._id })
      .populate("user", "username city")
      .sort({ createdAt: 1 }); // מסודרות לפי סדר יצירה
    res.json({ comments: comments || [] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת התגובות לפי דיון" });
  }
};

// ========================
// שליפת תגובות לפי קטגוריה (Category ID)
// ========================
exports.getCommentsByCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId).populate("discussions");
    if (!category) return res.status(404).json({ error: "קטגוריה לא נמצאה" });

    const discussionIds = category.discussions.map(d => d._id);

    const comments = await Comment.find({ discussion: { $in: discussionIds } })
      .populate("user", "username city")
      .populate("discussion", "topic")
      .sort({ createdAt: 1 });

    res.json({ comments: comments || [] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת התגובות לפי קטגוריה" });
  }
};

// ========================
// שליפת 10 התגובות האחרונות
// ========================
exports.getLast10Comments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("user", "username city")
      .populate("discussion", "topic")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ comments: comments || [] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת 10 התגובות האחרונות" });
  }
};

// ========================
// שליפת כל התגובות של משתמש (User ID)
// ========================
exports.getCommentsByUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "משתמש לא נמצא" });

    const comments = await Comment.find({ user: user._id })
      .populate("discussion", "topic")
      .sort({ createdAt: 1 });

    res.json({ comments: comments || [] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת התגובות של המשתמש" });
  }
};
