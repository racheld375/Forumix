// יצירה, עדכון, מחיקה

// שליפת כל הדיונים

// שליפת דיונים לפי קטגוריה

// שליפת 10 הדיונים האחרונים

// שליפת דיונים שיש בהם תגובה של משתמש מסוים

// כל create/update/delete כולל בדיקות תקינות לשדות החובה.

// populate של creator, category ו-comments בכל שליפה.

// ניתן להרחיב בעתיד עם סינון לפי תאריך, חיפוש נושאים, pagination.

const Discussion = require("../models/Discussions");
const Category = require("../models/Categorys");
const User = require("../models/Users");
const Comment = require("../models/Comments");

// ========================
// יצירת דיון חדש
// ========================
exports.createDiscussion = async (req, res) => {
  try {
    const {title, topic, creator, category } = req.body;

    // בדיקות תקינות
    if (!topic || !creator || !category||!title) {
      return res.status(400).json({ error: "חובה למלא: topic, creator, category" });
    }

    // בדיקה שהיוצר קיים
    const userExists = await User.findById(creator);
    if (!userExists) return res.status(404).json({ error: "משתמש יוצר לא נמצא" });

    // בדיקה שהקטגוריה קיימת
    const categoryExists = await Category.findById(category);
    if (!categoryExists) return res.status(404).json({ error: "קטגוריה לא נמצאה" });

    const newDiscussion = new Discussion({title, topic, creator, category });
    await newDiscussion.save();

    // הוספת הדיון למערך הדיונים של הקטגוריה
    categoryExists.discussions.push(newDiscussion._id);
    await categoryExists.save();

    res.status(201).json(newDiscussion);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה ביצירת הדיון" });
  }
};

// ========================
// עדכון דיון לפי ID
// ========================
exports.updateDiscussion = async (req, res) => {
  try {
    const {title, topic, category } = req.body;

    if (!title&&!topic && !category) {
      return res.status(400).json({ error: "אין שדות לעדכון" });
    }

    // בדיקה אם הקטגוריה חדשה קיימת
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) return res.status(404).json({ error: "קטגוריה לא נמצאה" });
    }

    const updatedDiscussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      {title, topic, category },
      { new: true, runValidators: true }
    );

    if (!updatedDiscussion) return res.status(404).json({ error: "דיון לא נמצא" });

    res.json(updatedDiscussion);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בעדכון הדיון" });
  }
};

// ========================
// מחיקת דיון לפי ID
// ========================
exports.deleteDiscussion = async (req, res) => {
  try {
    const deletedDiscussion = await Discussion.findByIdAndDelete(req.params.id);
    if (!deletedDiscussion) return res.status(404).json({ error: "דיון לא נמצא" });

    // הסרת מזהה הדיון מהקטגוריה
    await Category.findByIdAndUpdate(deletedDiscussion.category, { $pull: { discussions: deletedDiscussion._id } });

    res.json({ message: "דיון נמחק בהצלחה" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה במחיקת הדיון" });
  }
};

// ========================
// שליפת כל הדיונים
// ========================
exports.getAllDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("creator", "username city")
      .populate("category", "title")
      .populate("comments");
    res.json(discussions);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת הדיונים" });
  }


};

// ========================
// שליפת דיונים לפי קטגוריה
// ========================
// exports.getDiscussionsByCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.categoryId);
//     if (!category) return res.status(404).json({ error: "קטגוריה לא נמצאה" });

//     const discussions = await Discussion.find({ category: category._id })
//       .populate("creator", "username city")
//       .populate("comments");
//     res.json(discussions);

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "שגיאה בשליפת הדיונים לפי קטגוריה" });
//   }
// };
exports.getDiscussionsByCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ error: "קטגוריה לא נמצאה" });

    const discussions = await Discussion.find({ category: category._id })
      .populate("creator", "username city");

    // סופרים תגובות בזמן אמת עבור כל דיון
    const discussionsWithCount = await Promise.all(
      discussions.map(async (d) => {
        const commentsCount = await Comment.countDocuments({ discussion: d._id });
        return {
          _id: d._id,
          title: d.title,
          topic: d.topic,
          creator: d.creator,
          category: d.category,
          commentsCount,
          createdAt: d.createdAt
        };
      })
    );

    res.json(discussionsWithCount);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת הדיונים לפי קטגוריה" });
  }
};


// ========================
// שליפת 10 הדיונים האחרונים
// ========================
exports.getLast10Discussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate("creator", "username city")
      .populate("category", "title")
      .populate("comments")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(discussions);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת 10 הדיונים האחרונים" });
  }
};

// ========================
// שליפת כל הדיונים שיש בהם תגובה ממשתמש מסוים
// ========================
exports.getDiscussionsByUserComments = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "משתמש לא נמצא" });

    // כל התגובות של המשתמש
    const comments = await Comment.find({ user: user._id });

    // מזהי דיונים ייחודיים
    const discussionIds = [...new Set(comments.map(c => c.discussion.toString()))];

    const discussions = await Discussion.find({ _id: { $in: discussionIds } })
      .populate("creator", "username city")
      .populate("category", "title")
      .populate("comments");

    res.json(discussions);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת הדיונים של המשתמש" });
  }
};
// ========================
// שליפת דיון לפי מזהה
// ========================
exports.getDiscussionById = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId)
      .populate("creator", "username city")
      .populate("category", "title")
      .populate("comments");

    if (!discussion) return res.status(404).json({ error: "דיון לא נמצא" });

    res.json(discussion);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת הדיון" });
  }
};
