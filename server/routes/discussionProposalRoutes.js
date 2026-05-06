const express = require("express");
const router = express.Router();
const proposalController = require("../controllers/discussionProposalController");
const { authMiddleware, requireAdmin } = require("../conpig/authMiddleware");

router.post("/", authMiddleware, proposalController.createProposal);
router.get("/pending", authMiddleware, requireAdmin, proposalController.getPendingProposals);
router.post("/:id/approve", authMiddleware, requireAdmin, proposalController.approveProposal);
router.delete("/:id", authMiddleware, requireAdmin, proposalController.rejectProposal);

module.exports = router;
