const mongoose = require("mongoose");

const discussionProposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  note: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("DiscussionProposal", discussionProposalSchema);
