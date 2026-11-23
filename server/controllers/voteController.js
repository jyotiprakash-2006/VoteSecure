const Candidate = require("../models/Candidate");
const User = require("../models/User");
const ElectionSettings = require("../models/ElectionSettings");

const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    return res.json(candidates);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch candidates." });
  }
};

const castVote = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user._id;
    const settings = await ElectionSettings.findOne();

    if (settings && !settings.votingActive) {
      return res.status(400).json({ message: "Voting is not active right now." });
    }

    if (settings?.deadline && new Date() > new Date(settings.deadline)) {
      if (settings.votingActive) {
        settings.votingActive = false;
        await settings.save();
      }
      await User.updateMany({}, { $set: { hasVoted: false } });
      return res.status(400).json({ message: "Voting has ended." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, hasVoted: false },
      { $set: { hasVoted: true } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: "You have already voted." });
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { $inc: { votes: 1 } },
      { new: true }
    );

    if (!updatedCandidate) {
      await User.findByIdAndUpdate(userId, { $set: { hasVoted: false } });
      return res.status(404).json({ message: "Candidate not found." });
    }

    return res.json({
      message: `Vote cast for ${updatedCandidate.name}.`,
      hasVoted: true
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to cast vote." });
  }
};

module.exports = { getCandidates, castVote };
