const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authMiddleware, requireAdmin ,
    requireProfessionalCategory,
    requireVerifiedProfessional} = require("../conpig/authMiddleware");
// יצירת קטגוריה – רק מנהל
router.post(
    "/",
    authMiddleware,
    requireAdmin,
    categoryController.createCategory
  );
  
  // עדכון קטגוריה לפי ID – רק מנהל
  router.put(
    "/:id",
    authMiddleware,
    requireAdmin,
    categoryController.updateCategory
  );
  
  // מחיקת קטגוריה לפי ID – רק מנהל
  router.delete(
    "/:id",
    authMiddleware,
    requireAdmin,
    categoryController.deleteCategory
  );
  
// שליפת כל הקטגוריות
router.get("/", categoryController.getAllCategories);

// שליפת קטגוריה לפי דיון
router.get("/by-discussion/:discussionId", categoryController.getCategoryByDiscussion);

module.exports = router;
