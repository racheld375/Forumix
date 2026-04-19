const Category = require("../models/Categorys");
const Discussion = require("../models/Discussions");

// ========================
// יצירת קטגוריה חדשה
// ========================
exports.createCategory = async (req, res) => {
  try {
    const { title } = req.body;

    // בדיקה שהגיע title
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "חובה למלא את כותרת הקטגוריה" });
    }

    const newCategory = new Category({ title });
    await newCategory.save();
    res.status(201).json(newCategory);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה ביצירת הקטגוריה" });
  }
};

// ========================
// עדכון קטגוריה לפי ID
// ========================
exports.updateCategory = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "חובה למלא את כותרת הקטגוריה" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) return res.status(404).json({ error: "קטגוריה לא נמצאה" });
    res.json(updatedCategory);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בעדכון הקטגוריה" });
  }
};

// ========================
// מחיקת קטגוריה לפי ID
// ========================
exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) return res.status(404).json({ error: "קטגוריה לא נמצאה" });

    res.json({ message: "קטגוריה נמחקה בהצלחה" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה במחיקת הקטגוריה" });
  }
};

// ========================
// שליפת כל הקטגוריות
// ========================
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate({
      path: "discussions",
      populate: [
        { path: "creator", select: "username city" },
        { path: "comments" }
      ]
    });
    res.json(categories);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת הקטגוריות" });
  }
};

// ========================
// שליפת קטגוריה לפי דיון (Discussion ID)
// ========================
exports.getCategoryByDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.discussionId);
    if (!discussion) return res.status(404).json({ error: "דיון לא נמצא" });

    const category = await Category.findById(discussion.category).populate("discussions");
    if (!category) return res.status(404).json({ error: "קטגוריה לא נמצאה" });

    res.json(category);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת הקטגוריה לפי דיון" });
  }
};
