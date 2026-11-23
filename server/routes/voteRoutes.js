const express = require("express");
const { getCandidates, castVote } = require("../controllers/voteController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/candidates", getCandidates);
router.post("/vote/:candidateId", protect, castVote);

module.exports = router;
