const express = require("express");
const {
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getResults,
  getElectionSettings,
  updateElectionSettings,
  announceWinner,
  startVoting,
  endVoting
} = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/results", protect, getResults);
router.get("/election-settings", protect, adminOnly, getElectionSettings);
router.put("/election-settings", protect, adminOnly, updateElectionSettings);
router.post("/announce-winner", protect, adminOnly, announceWinner);
router.post("/voting/start", protect, adminOnly, startVoting);
router.post("/voting/end", protect, adminOnly, endVoting);
router.post("/candidate", protect, adminOnly, createCandidate);
router.put("/candidate/:id", protect, adminOnly, updateCandidate);
router.delete("/candidate/:id", protect, adminOnly, deleteCandidate);

module.exports = router;
