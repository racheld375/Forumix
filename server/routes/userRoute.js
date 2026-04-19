const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// יצירת משתמש חדש
router.post("/", userController.createUser);

// עדכון משתמש לפי ID
router.put("/:id", userController.updateUser);

// מחיקת משתמש לפי ID
router.delete("/:id", userController.deleteUser);

// שליפת כל המשתמשים
router.get("/", userController.getAllUsers);

// שליפת משתמש לפי ID
router.get("/:id", userController.getUserById);

// שליפת משתמש לפי תגובה (Comment ID)
router.get("/by-comment/:commentId", userController.getUserByComment);

module.exports = router;

