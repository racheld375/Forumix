const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },                    // תוכן התגובה
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // מי כתב
  discussion: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion", required: true }, // הדיון
  createdAt: { type: Date, default: Date.now }                  // תאריך ושעה
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
