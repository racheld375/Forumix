const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },                        // כותרת הנושא הראשי
  discussions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Discussion" }], // מערך דיונים
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;

