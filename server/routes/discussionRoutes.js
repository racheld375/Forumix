const express = require("express");
const router = express.Router();
const discussionController = require("../controllers/discussionController");
// const authMiddleware=require("../conpig/authMiddleware");
const { authMiddleware, requireAdmin ,
    requireProfessionalCategory,
    requireVerifiedProfessional} = require("../conpig/authMiddleware");


// יצירת דיון – רק מנהל
router.post(
    "/",
    // authMiddleware,          // 1️⃣ בודק טוקן ותוקף המשתמש
    // requireAdmin,    // 2️⃣ בודק שהמשתמש מנהל
    discussionController.createDiscussion  // 3️⃣ הפונקציה שמבצעת את יצירת הדיון
  );

// עדכון דיון לפי ID
router.put("/:id",
    authMiddleware,          // 1️⃣ בודק טוקן ותוקף המשתמש
    requireAdmin,    // 2️⃣ בודק שהמשתמש מנהל
    discussionController.updateDiscussion);
//מחיקה
router.delete(
    "/:id",
    authMiddleware,          // 1️⃣ בודק טוקן ותוקף המשתמש
    requireAdmin,    // 2️⃣ בודק שהמשתמש מנהל
    discussionController.deleteDiscussion  // 3️⃣ הפונקציה האמיתית שמוחקת
  );
// שליפת כל הדיונים
router.get("/", discussionController.getAllDiscussions);

// חיפוש דיונים
router.get("/search", discussionController.searchDiscussions);

// שליפת דיונים לפי קטגוריה
router.get("/by-category/:categoryId", discussionController.getDiscussionsByCategory);
/*router.get(
    "/by-category/:categoryId",
    authMiddleware,
    // requireProfessionalCategory,
    requireVerifiedProfessional,
    discussionController.getDiscussionsByCategory
  );*/
  

// שליפת 10 הדיונים האחרונים
router.get("/last10", discussionController.getLast10Discussions);

// שליפת כל הדיונים שיש בהם תגובה של משתמש
router.get("/by-user-comments/:userId", discussionController.getDiscussionsByUserComments);
// שליפת דיון לפי מזהה
router.get("/:discussionId", discussionController.getDiscussionById);

module.exports = router;
