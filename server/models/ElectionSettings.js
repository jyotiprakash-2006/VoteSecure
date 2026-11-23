const mongoose = require("mongoose");

const electionSettingsSchema = new mongoose.Schema(
  {
    deadline: {
      type: Date,
      default: null
    },
    winnerAnnounced: {
      type: Boolean,
      default: false
    },
    votingActive: {
      type: Boolean,
      default: false
    },
    announcedAt: {
      type: Date,
      default: null
    },
    announcedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    announcedWinner: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    announcedIsTie: {
      type: Boolean,
      default: false
    },
    announcedTotalVotes: {
      type: Number,
      default: 0
    },
    announcedResults: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ElectionSettings", electionSettingsSchema);
