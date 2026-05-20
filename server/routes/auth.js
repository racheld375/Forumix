const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authMiddleware, requireAdmin } = require("../conpig/authMiddleware");

router.post("/register", async (req, res) => {
    try {
      const { username, password, age, city } = req.body;
  
      // בדיקה בסיסית
      if (!username || !password)
        return res.status(400).json({ message: "חסר שם משתמש או סיסמה" });
  
      // בדיקה אם המשתמש קיים
      const existingUser = await User.findOne({ username });
      if (existingUser)
        return res.status(400).json({ message: "משתמש כבר קיים" });
  
      // יצירת משתמש חדש
      const user = new User({
        username,
        passwordHash: password, // ❗ סיסמה רגילה
        age,
        city
      });
  
      await user.save(); // 🔐 כאן מתבצעת ההצפנה (pre save)
  
      res.status(201).json({ message: "משתמש נוצר בהצלחה" });
    } catch (err) {
      res.status(500).json({ message: "שגיאת שרת" });
    }
  });


  


  router.post("/login", async (req, res) => {
    try {
      const { username, password } = req.body;
  
      // חיפוש משתמש
      const user = await User.findOne({ username });
      if (!user)
        return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
  
      // 🔍 בדיקת סיסמה
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch)
        return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });
  
      // יצירת טוקן
      // const token = jwt.sign(
      //   {
      //     userId: user._id,
      //     role: user.role,
      //     profession: user.advancedInfo?.profession
      //   },
      //   process.env.JWT_SECRET,
      //   { expiresIn: "1h" }
      // );
      const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.username,
        profession: user.advancedInfo?.profession,
        advancedInfo: user.advancedInfo
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
      );

      res.json({ token });
    } catch (err) {
      res.status(500).json({ message: "שגיאת שרת" });
    }
  });

router.post("/register-admin", authMiddleware, requireAdmin, async (req, res) => {
    try {
      const { username, password, age, city } = req.body;

      if (!username || !password || age == null || !city) {
        return res.status(400).json({ message: "חובה למלא שם משתמש, סיסמה, גיל ועיר" });
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "משתמש כבר קיים" });
      }

      const user = new User({
        username,
        passwordHash: password,
        age,
        city,
        role: "admin"
      });

      await user.save();

      res.status(201).json({ message: "מנהל נוצר בהצלחה" });
    } catch (err) {
      res.status(500).json({ message: "שגיאת שרת" });
    }
  });

  module.exports = router;
  
  
