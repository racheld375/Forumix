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

async function requestGeminiSummary({ discussion, comments, lines }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY_MISSING");
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

  const prompt = `
אתה מערכת שמסכמת דיונים בפורום.

הוראות:
- כתוב בעברית
- סכם בצורה תמציתית וברורה
- מקסימום ${lines} שורות
- ללא פתיחים מיותרים

כותרת: ${discussion.title}
נושא: ${discussion.topic}
קטגוריה: ${discussion.category?.title || "כללי"}

תגובות:
${transcript}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const apiMessage = data?.error?.message || "Gemini request failed";
    throw new Error(apiMessage);
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
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

    const existingDiscussion = await Discussion.findById(req.params.id);
    if (!existingDiscussion) return res.status(404).json({ error: "דיון לא נמצא" });

    const previousCategory = existingDiscussion.category?.toString();

    if (title !== undefined) existingDiscussion.title = title;
    if (topic !== undefined) existingDiscussion.topic = topic;
    if (category !== undefined) existingDiscussion.category = category;

    const updatedDiscussion = await existingDiscussion.save();

    if (category && previousCategory !== category) {
      await Promise.all([
        Category.findByIdAndUpdate(previousCategory, { $pull: { discussions: updatedDiscussion._id } }),
        Category.findByIdAndUpdate(category, { $addToSet: { discussions: updatedDiscussion._id } })
      ]);
    }

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

    // const summaryText = await requestGeminiSummary({ discussion, comments, lines });
    let summaryText = "";
let usedFallback = false;

try {
  summaryText = await requestGeminiSummary({
    discussion,
    comments,
    lines
  });
} catch (err) {
  console.error("AI failed, using fallback:", err.message);

  usedFallback = true;
  summaryText = buildFallbackSummary(discussion, comments, lines);
}
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
      generatedAt: new Date().toISOString(),
      usedFallback
    });
  } catch (err) {
    console.error(err);
if (err.message === "GEMINI_API_KEY_MISSING") {
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
function buildFallbackSummary(discussion, comments, lines) {
  const text = comments
    .slice(0, lines)
    .map(c => `• ${c.user?.username || "משתמש"}: ${c.content}`)
    .join("\n");

  return `
תקציר דיון (ללא AI):

נושא: ${discussion.title}

עיקרי התגובות:
${text}

סה"כ תגובות: ${comments.length}
  `.trim();
}
