const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authMiddleware, requireAdmin } = require("../conpig/authMiddleware");
const fs = require("fs");
const path = require("path");

const TERMS_FILE_PATH = path.join(__dirname, "..", "תקנון יחד בדרך.pdf");
const SIGNED_TERMS_DIR = path.join(__dirname, "..", "signed-terms");
const MAX_TERMS_FILE_SIZE = 8 * 1024 * 1024;

function sanitizeFileName(fileName = "signed-terms.pdf") {
  return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

function decodeTermsFile(termsFile) {
  if (!termsFile?.data) {
    throw new Error("חובה להעלות תקנון חתום");
  }

  const base64Data = String(termsFile.data).replace(/^data:application\/pdf;base64,/, "");
  const fileBuffer = Buffer.from(base64Data, "base64");

  if (!fileBuffer.length || fileBuffer.length > MAX_TERMS_FILE_SIZE) {
    throw new Error("קובץ התקנון חייב להיות PDF עד 8MB");
  }

  if (fileBuffer.subarray(0, 4).toString() !== "%PDF") {
    throw new Error("אפשר להעלות רק קובץ PDF חתום");
  }

  return fileBuffer;
}

router.get("/terms", (req, res) => {
  res.download(TERMS_FILE_PATH, "תקנון יחד בדרך.pdf");
});

router.post("/register", async (req, res) => {
    try {
      const { username, password, age, city, advancedInfo, termsFile } = req.body;
  
      // בדיקה בסיסית
      if (!username || !password || age == null || !city)
        return res.status(400).json({ message: "חובה למלא שם משתמש, סיסמה, גיל ועיר" });

      let signedTermsBuffer;
      try {
        signedTermsBuffer = decodeTermsFile(termsFile);
      } catch (fileErr) {
        return res.status(400).json({ message: fileErr.message });
      }
  
      // בדיקה אם המשתמש קיים
      const existingUser = await User.findOne({ username });
      if (existingUser)
        return res.status(400).json({ message: "משתמש כבר קיים" });
  
      // יצירת משתמש חדש
      const user = new User({
        username,
        passwordHash: password, // ❗ סיסמה רגילה
        age,
        city,
        advancedInfo: advancedInfo || {}
      });

      fs.mkdirSync(SIGNED_TERMS_DIR, { recursive: true });

      const safeOriginalName = sanitizeFileName(termsFile.name);
      const savedFileName = `${user._id}-${Date.now()}-${safeOriginalName || "signed-terms.pdf"}`;
      const savedFilePath = path.join(SIGNED_TERMS_DIR, savedFileName);
      fs.writeFileSync(savedFilePath, signedTermsBuffer);

      user.termsAgreement = {
        originalName: safeOriginalName,
        fileName: savedFileName,
        path: path.relative(path.join(__dirname, ".."), savedFilePath),
        uploadedAt: new Date()
      };
  
      try {
        await user.save(); // 🔐 כאן מתבצעת ההצפנה (pre save)
      } catch (saveErr) {
        fs.unlink(savedFilePath, () => {});
        throw saveErr;
      }
  
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
  
  
