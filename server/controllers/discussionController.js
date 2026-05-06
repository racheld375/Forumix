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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampSummaryLines(value) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) return 8;
  return Math.min(20, Math.max(5, parsed));
}

async function requestOpenAiSummary({ discussion, comments, lines }) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key") {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  if (typeof fetch !== "function") {
    throw new Error("FETCH_UNAVAILABLE");
  }

  const transcript = comments.length > 0
    ? comments.map((comment, index) => {
        const author = comment.user?.username || "משתמש";
        return `${index + 1}. ${author}: ${comment.content}`;
      }).join("\n")
    : "אין תגובות עדיין לדיון הזה.";

  const prompt = [
    "הכן תקציר בעברית לדיון בפורום.",
    `התקציר חייב להיות בין ${lines} ל-${lines + 1} שורות קצרות לכל היותר.`,
    "החזר טקסט נקי בלבד, בלי כותרות markdown, בלי פתיחים כמו 'הנה התקציר', ובלי רשימות ממוספרות.",
    "התקציר צריך לתאר את מוקד הדיון, עמדות בולטות, ומה עלה מהתגובות.",
    "",
    `כותרת הדיון: ${discussion.title}`,
    `נושא הדיון: ${discussion.topic}`,
    `קטגוריה: ${discussion.category?.title || "כללי"}`,
    "",
    "תגובות:",
    transcript
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "אתה מסכם דיונים בפורום בצורה מדויקת, בהירה וקצרה בעברית."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const apiMessage = data?.error?.message || "OpenAI request failed";
    throw new Error(apiMessage);
  }

  return data?.choices?.[0]?.message?.content?.trim() || "";
}

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

// ========================
// יצירת תקציר AI לדיון
// ========================
exports.generateAiSummary = async (req, res) => {
  try {
    const lines = clampSummaryLines(req.body?.lines);

    const discussion = await Discussion.findById(req.params.discussionId)
      .populate("creator", "username city")
      .populate("category", "title");

    if (!discussion) {
      return res.status(404).json({ error: "דיון לא נמצא" });
    }

    const comments = await Comment.find({ discussion: discussion._id })
      .populate("user", "username")
      .sort({ createdAt: 1 });

    const summaryText = await requestOpenAiSummary({ discussion, comments, lines });

    if (!summaryText) {
      return res.status(502).json({ error: "לא התקבל תקציר משירות ה-AI" });
    }

    res.json({
      title: discussion.title,
      topic: discussion.topic,
      category: discussion.category?.title || "כללי",
      commentsCount: comments.length,
      participantsCount: [...new Set(comments.map((comment) => comment.user?._id?.toString()).filter(Boolean))].length,
      lines,
      summary: summaryText,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);

    if (err.message === "OPENAI_API_KEY_MISSING") {
      return res.status(500).json({ error: "OPENAI_API_KEY לא מוגדר בשרת או עדיין מוגדר כערך דמה" });
    }

    if (err.message === "FETCH_UNAVAILABLE") {
      return res.status(500).json({ error: "השרת לא תומך בבקשות fetch עבור שירות ה-AI" });
    }

    res.status(500).json({ error: err.message || "שגיאה ביצירת תקציר AI" });
  }
};

// ========================
// חיפוש בכל הקטגוריות, הדיונים והתגובות
// ========================
exports.searchDiscussions = async (req, res) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.json([]);
    }

    const regex = new RegExp(escapeRegex(query), "i");

    const [matchingCategories, matchingDiscussions, matchingComments] = await Promise.all([
      Category.find({ title: regex }).select("_id"),
      Discussion.find({
        $or: [
          { title: regex },
          { topic: regex }
        ]
      }).select("_id title topic"),
      Comment.find({ content: regex }).select("discussion")
    ]);

    const categoryDiscussionIds = matchingCategories.length > 0
      ? await Discussion.find({
          category: { $in: matchingCategories.map((category) => category._id) }
        }).select("_id")
      : [];

    const discussionIds = [
      ...matchingDiscussions.map((discussion) => discussion._id.toString()),
      ...matchingComments.map((comment) => comment.discussion.toString()),
      ...categoryDiscussionIds.map((discussion) => discussion._id.toString())
    ];

    const uniqueDiscussionIds = [...new Set(discussionIds)];

    if (uniqueDiscussionIds.length === 0) {
      return res.json([]);
    }

    const discussions = await Discussion.find({ _id: { $in: uniqueDiscussionIds } })
      .populate("creator", "username city")
      .populate("category", "title");

    const results = await Promise.all(
      discussions.map(async (discussion) => {
        const commentsCount = await Comment.countDocuments({ discussion: discussion._id });
        const matchedIn = [];

        if (regex.test(discussion.title) || regex.test(discussion.topic)) {
          matchedIn.push("discussion");
        }

        if (discussion.category?.title && regex.test(discussion.category.title)) {
          matchedIn.push("category");
        }

        const matchingComment = await Comment.findOne({
          discussion: discussion._id,
          content: regex
        }).select("content");

        if (matchingComment) {
          matchedIn.push("comment");
        }

        return {
          _id: discussion._id,
          title: discussion.title,
          topic: discussion.topic,
          creator: discussion.creator,
          category: discussion.category,
          commentsCount,
          createdAt: discussion.createdAt,
          matchedIn,
          commentPreview: matchingComment?.content || null
        };
      })
    );

    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בחיפוש דיונים" });
  }
};
