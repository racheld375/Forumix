const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true },  
  topic: { type: String, required: true },                          // נושא הדיון
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // היוצר
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }, // קטגוריה
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],  // מערך תגובות
  createdAt: { type: Date, default: Date.now }
},{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// וירטואלי לחישוב כמות התגובות
discussionSchema.virtual("commentsCount").get(function () {
  return this.comments?.length || 0;
});

const Discussion = mongoose.model("Discussion", discussionSchema);

module.exports = Discussion;

