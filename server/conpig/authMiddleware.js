const jwt = require("jsonwebtoken");

// רשימת מקצועות מוגדרת מראש
const PROFESSIONS = [
  "הייטק",
  "עצמאיות",
  "עיצוב גרפי",
  "צילום מקצועי",
  "אדריכלות ועיצוב פנים",
  "אומנות הבמה והפקות תוכן",
  "טיפול יעוץ  והנחיה",
  "כתיבה ספרותית",
  "חשבונאות ומיסים",
  "תזונה בריאות והתעמלות",
  "הוראה למידה ועזרים",
  "אולפן סאונד ונגינה",
  "קופירייטינג"
];

// middleware לאימות טוקן
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "אין טוקן" });

  const token = authHeader.split(" ")[1]; // "Bearer <token>"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // כאן נשמר userId, role, profession
    next();
  } catch {
    res.status(401).json({ message: "טוקן לא תקף" });
  }
}

// middleware לבדיקה אם המשתמש מנהל
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "אין טוקן" });

  if (req.user.role !== "admin")
    return res.status(403).json({ message: "אין הרשאת מנהל" });

  next();
}

// middleware לבדיקה אם המשתמש professional ויכול לגשת לקטגוריה
function requireProfessionalCategory(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "אין טוקן" });

  if (req.user.role !== "professional")
    return res.status(403).json({ message: "מיועד למקצועיים בלבד" });

  const categoryParam = req.params.categoryId || req.params.profession;

  if (!PROFESSIONS.includes(categoryParam))
    return res.status(403).json({ message: "קטגוריה אינה מקצועית" });

  if (req.user.profession !== categoryParam)
    return res.status(403).json({ message: "אין הרשאת גישה לקטגוריה זו" });

  next();
}

// middleware – בודק שהמשתמש מקצועי ואושר
function requireVerifiedProfessional(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "אין טוקן" });
    }
  
    if (req.user.role !== "professional") {
      return res.status(403).json({ message: "מיועד למקצועיים בלבד" });
    }
  
    // בדיקה שה-professional אושר
    if (!req.user.advancedInfo?.approved) {
      return res.status(403).json({ message: "המשתמש לא אושר למידע מתקדם" });
    }
  
    next();
  }
  
  module.exports = {
    authMiddleware,
    requireAdmin,
    requireProfessionalCategory,
    requireVerifiedProfessional
  };
