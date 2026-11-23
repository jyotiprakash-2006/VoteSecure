const Candidate = require("../models/Candidate");
const ElectionSettings = require("../models/ElectionSettings");
const User = require("../models/User");
const AUTO_ANNOUNCE_DELAY_MS = 5000;

const getOrCreateElectionSettings = async () => {
  let settings = await ElectionSettings.findOne();
  if (!settings) {
    settings = await ElectionSettings.create({});
  }
  return settings;
};

const resetAllVotesForNewRound = async () => {
  await Candidate.updateMany({}, { $set: { votes: 0 } });
  await User.updateMany({}, { $set: { hasVoted: false } });
};

const resetVoterEligibility = async () => {
  await User.updateMany({}, { $set: { hasVoted: false } });
};

const performWinnerAnnouncement = async (settings, announcedBy = null) => {
  const results = await Candidate.find().sort({ votes: -1 });
  if (!results.length) {
    return { error: "No candidates available for declaration." };
  }

  const { totalVotes, winner, isTie } = computeWinner(results);
  if (totalVotes === 0 || !winner) {
    return { error: "No votes have been cast yet." };
  }

  settings.winnerAnnounced = true;
  settings.announcedAt = new Date();
  settings.announcedBy = announcedBy;
  settings.announcedWinner = winner;
  settings.announcedIsTie = isTie;
  settings.announcedTotalVotes = totalVotes;
  settings.announcedResults = results.map((candidate) => ({
    _id: candidate._id,
    name: candidate.name,
    party: candidate.party,
    votes: candidate.votes
  }));
  settings.votingActive = false;
  await settings.save();

  await resetAllVotesForNewRound();

  return { totalVotes, winner, isTie };
};

const maybeAutoAnnounceWinner = async (settings) => {
  if (settings.winnerAnnounced || !settings.deadline) {
    return settings;
  }

  const deadlineMs = new Date(settings.deadline).getTime();
  if (Number.isNaN(deadlineMs)) {
    return settings;
  }

  if (Date.now() < deadlineMs + AUTO_ANNOUNCE_DELAY_MS) {
    return settings;
  }

  const outcome = await performWinnerAnnouncement(settings, null);
  if (outcome.error) {
    return settings;
  }

  return settings;
};

const computeWinner = (results) => {
  const totalVotes = results.reduce((sum, c) => sum + c.votes, 0);
  let winner = null;
  let isTie = false;

  if (results.length && totalVotes > 0) {
    const highestVotes = results[0].votes;
    const topCandidates = results.filter((candidate) => candidate.votes === highestVotes);

    if (topCandidates.length === 1) {
      winner = {
        _id: topCandidates[0]._id,
        name: topCandidates[0].name,
        party: topCandidates[0].party,
        votes: topCandidates[0].votes
      };
    } else {
      isTie = true;
      winner = topCandidates.map((candidate) => ({
        _id: candidate._id,
        name: candidate.name,
        party: candidate.party,
        votes: candidate.votes
      }));
    }
  }

  return { totalVotes, winner, isTie };
};

const createCandidate = async (req, res) => {
  try {
    const { name, party } = req.body;
    if (!name || !party) {
      return res.status(400).json({ message: "Name and party are required." });
    }

    const candidate = await Candidate.create({ name, party });
    return res.status(201).json({ message: "Candidate created.", candidate });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create candidate." });
  }
};

const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, party } = req.body;

    if (!name || !party) {
      return res.status(400).json({ message: "Name and party are required." });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { name, party },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    return res.json({ message: "Candidate updated.", candidate });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update candidate." });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByIdAndDelete(id);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    return res.json({ message: "Candidate deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete candidate." });
  }
};

const getResults = async (req, res) => {
  try {
    const settings = await getOrCreateElectionSettings();
    await maybeAutoAnnounceWinner(settings);
    const liveResults = await Candidate.find().sort({ votes: -1 });
    const results = settings.winnerAnnounced ? settings.announcedResults || [] : liveResults;
    const { totalVotes, winner, isTie } = computeWinner(results);

    const announcedWinner = settings.winnerAnnounced
      ? (settings.announcedWinner ?? winner)
      : null;
    const announcedIsTie = settings.winnerAnnounced
      ? (settings.announcedIsTie ?? isTie)
      : false;
    const displayTotalVotes = settings.winnerAnnounced
      ? (settings.announcedTotalVotes ?? totalVotes)
      : totalVotes;

    return res.json({
      totalVotes: displayTotalVotes,
      results,
      winner: announcedWinner,
      isTie: announcedIsTie,
      winnerAnnounced: settings.winnerAnnounced,
      deadline: settings.deadline,
      votingActive: settings.votingActive
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch results." });
  }
};

const getElectionSettings = async (req, res) => {
  try {
    const settings = await getOrCreateElectionSettings();
    await maybeAutoAnnounceWinner(settings);
    return res.json({
      deadline: settings.deadline,
      winnerAnnounced: settings.winnerAnnounced,
      announcedAt: settings.announcedAt,
      votingActive: settings.votingActive
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch election settings." });
  }
};

const updateElectionSettings = async (req, res) => {
  try {
    const { deadline } = req.body;
    if (!deadline) {
      return res.status(400).json({ message: "Deadline is required." });
    }

    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ message: "Invalid deadline format." });
    }

    const settings = await getOrCreateElectionSettings();
    const deadlinePassed =
      settings.deadline && new Date() >= new Date(settings.deadline);

    if (settings.votingActive && deadlinePassed) {
      settings.votingActive = false;
      await settings.save();
      await resetVoterEligibility();
    }

    if (settings.votingActive) {
      return res.status(400).json({
        message: "Deadline cannot be changed while voting is active. End voting first."
      });
    }

    settings.deadline = parsedDeadline;
    settings.winnerAnnounced = false;
    settings.announcedAt = null;
    settings.announcedBy = null;
    settings.announcedWinner = null;
    settings.announcedIsTie = false;
    settings.announcedTotalVotes = 0;
    settings.announcedResults = [];
    await settings.save();

    return res.json({
      message: "Election deadline saved.",
      deadline: settings.deadline,
      winnerAnnounced: settings.winnerAnnounced,
      votingActive: settings.votingActive
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update election settings." });
  }
};

const announceWinner = async (req, res) => {
  try {
    const settings = await getOrCreateElectionSettings();

    if (!settings.deadline) {
      return res.status(400).json({ message: "Please set a deadline first." });
    }

    if (new Date() < new Date(settings.deadline)) {
      return res.status(400).json({ message: "Winner can be announced only after the deadline." });
    }

    if (settings.winnerAnnounced) {
      return res.status(400).json({ message: "Winner has already been announced." });
    }

    const outcome = await performWinnerAnnouncement(settings, req.user._id);
    if (outcome.error) {
      return res.status(400).json({ message: outcome.error });
    }

    return res.json({
      message: "Winner announced successfully.",
      winner: outcome.winner,
      isTie: outcome.isTie,
      totalVotes: outcome.totalVotes
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to announce winner." });
  }
};

const startVoting = async (req, res) => {
  try {
    const settings = await getOrCreateElectionSettings();
    const deadlinePassed =
      settings.deadline && new Date() >= new Date(settings.deadline);

    if (settings.votingActive && deadlinePassed) {
      settings.votingActive = false;
      await settings.save();
      await resetVoterEligibility();
    }

    if (settings.votingActive) {
      return res.json({
        message: "Voting is already active.",
        votingActive: true
      });
    }

    if (!settings.deadline) {
      return res.status(400).json({ message: "Please set a voting deadline before starting." });
    }

    if (new Date() >= new Date(settings.deadline)) {
      return res.status(400).json({ message: "Deadline has passed. Update deadline to start voting." });
    }

    settings.votingActive = true;
    settings.winnerAnnounced = false;
    settings.announcedAt = null;
    settings.announcedBy = null;
    settings.announcedWinner = null;
    settings.announcedIsTie = false;
    settings.announcedTotalVotes = 0;
    settings.announcedResults = [];
    await settings.save();

    await resetAllVotesForNewRound();

    return res.json({
      message: "Voting has started.",
      votingActive: settings.votingActive
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to start voting." });
  }
};

const endVoting = async (req, res) => {
  try {
    const settings = await getOrCreateElectionSettings();

    if (!settings.votingActive) {
      await resetVoterEligibility();
      return res.json({
        message: "Voting is already inactive. User vote access has been reset.",
        votingActive: false
      });
    }

    settings.votingActive = false;
    await settings.save();

    await resetVoterEligibility();

    return res.json({
      message: "Voting has ended. Users can vote again when voting is started.",
      votingActive: settings.votingActive
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to end voting." });
  }
};

module.exports = {
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getResults,
  getElectionSettings,
  updateElectionSettings,
  announceWinner,
  startVoting,
  endVoting
};
