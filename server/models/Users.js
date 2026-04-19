const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// רשימת מקצועות מוגדרת מראש
const PROFESSIONS = ["הייטק", "עצמאיות", "עיצוב גרפי", "צילום מקצועי", "אדריכלות ועיצוב פנים","אומנות הבמה והפקות תוכן","טיפול יעוץ  והנחיה","כתיבה ספרותית","חשבונאות ומיסים","תזונה בריאות והתעמלות","הוראה למידה ועזרים","אולפן סאונד ונגינה","קופירייטינג"];

const advancedInfoSchema = new mongoose.Schema({
  profession: { 
    type: String, 
    enum: PROFESSIONS, // חובה להיות אחד מהמקצועות ברשימה
    //required: true 
  },
  educationPlace: { type: String }, // מקום לימודים   , required: true
  startYear: { type: Number }, // שנה שהתחיל נסיון   , required: true
  approved: { type: Boolean, default: false } // האם המידע אושר
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    age: { type: Number, required: true, min: 0 },
    city: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    advancedInfo: { type: advancedInfoSchema, default: {} },
    role: {
        type: String,
        enum: ["admin", "user", "professional"],
        default: "user"
      },
    // מערך של תגובות – מאחסן רק את ה-ObjectId של תגובות
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
  });

// פונקציה נוחה לבדיקה אם המשתמש אושר לגישה למידע מתקדם
// userSchema.methods.isVerified = function () {
//   return this.advancedInfo?.approved === true;
// };
userSchema.pre("save", async function () {
  // אם הסיסמה לא השתנתה – לא מצפינים שוב
  if (!this.isModified("passwordHash")) return;

  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
