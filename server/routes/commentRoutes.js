const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
console.log("Controller loaded:", commentController);
const { authMiddleware, requireAdmin ,
    requireProfessionalCategory,
    requireVerifiedProfessional} = require("../conpig/authMiddleware");
// יצירת תגובה

router.post(
    "/",
    authMiddleware,
    commentController.createComment
  );

// עדכון תגובה לפי ID
router.put("/:id", authMiddleware, requireAdmin, commentController.updateComment);

// מחיקת תגובה לפי ID
router.delete("/:id", authMiddleware, requireAdmin, commentController.deleteComment);

// שליפת כל התגובות
router.get("/", commentController.getAllComments);

// שליפת תגובות לפי דיון
router.get("/by-discussion/:discussionId", commentController.getCommentsByDiscussion);

// שליפת תגובות לפי קטגוריה
router.get("/by-category/:categoryId", commentController.getCommentsByCategory);

// שליפת 10 התגובות האחרונות
router.get("/last10", commentController.getLast10Comments);

// שליפת כל התגובות של משתמש
router.get("/by-user/:userId", commentController.getCommentsByUser);

module.exports = router;
