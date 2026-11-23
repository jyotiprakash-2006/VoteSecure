import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { adminService, authService, voteService } from "../services/api";

const VotingDashboard = ({ user, setUser }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voteLoadingId, setVoteLoadingId] = useState("");
  const [votingActive, setVotingActive] = useState(false);
  const previousVotingActiveRef = useRef(null);

  const fetchCandidates = useCallback(async () => {
    try {
      const { data } = await voteService.getCandidates();
      setCandidates(data);
    } catch (error) {
      toast.error("Failed to load candidates.");
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await authService.getMe();
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      toast.error("Session expired. Please login again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  }, [setUser]);

  const refreshCurrentUserSilently = useCallback(async () => {
    try {
      const { data } = await authService.getMe();
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      // Ignore polling errors here. Session errors are handled by initial fetch.
    }
  }, [setUser]);

  const fetchVotingStatus = useCallback(async () => {
    try {
      const { data } = await adminService.getResults();
      const isVotingActive = Boolean(data.votingActive);
      setVotingActive(isVotingActive);

      if (previousVotingActiveRef.current !== isVotingActive) {
        previousVotingActiveRef.current = isVotingActive;
        await refreshCurrentUserSilently();
      }
    } catch (error) {
      setVotingActive(false);
    }
  }, [refreshCurrentUserSilently]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCandidates(), fetchCurrentUser(), fetchVotingStatus()]);
      setLoading(false);
    };

    init();
  }, [fetchCandidates, fetchCurrentUser, fetchVotingStatus]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchVotingStatus();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchVotingStatus]);

  useEffect(() => {
    if (!votingActive && user?.hasVoted) {
      const refreshUser = async () => {
        await fetchCurrentUser();
      };
      refreshUser();
    }
  }, [votingActive, user?.hasVoted, fetchCurrentUser]);

  const handleVote = async (candidateId) => {
    try {
      setVoteLoadingId(candidateId);
      const { data } = await voteService.vote(candidateId);
      toast.success(data.message);
      const updatedUser = { ...user, hasVoted: true };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      await fetchCandidates();
      await fetchVotingStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Voting failed.");
      if (
        error.response?.data?.message === "Voting has ended." ||
        error.response?.data?.message === "Voting is not active right now."
      ) {
        setVotingActive(false);
        await fetchCurrentUser();
      }
    } finally {
      setVoteLoadingId("");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <h2 className="mb-3">Voting Dashboard</h2>
      {!votingActive && (
        <div className="alert alert-warning">
          Voting is currently inactive. Please wait for the admin to start voting.
        </div>
      )}
      {user?.hasVoted && (
        <div className="alert alert-success">
          You have already voted. Thank you for participating.
        </div>
      )}
      <div className="row g-3">
        {candidates.map((candidate) => (
          <div className="col-md-4" key={candidate._id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{candidate.name}</h5>
                <p className="card-text mb-3">
                  <strong>Party:</strong> {candidate.party}
                </p>
                <button
                  className="btn btn-primary w-100"
                  onClick={() => handleVote(candidate._id)}
                  disabled={!votingActive || user?.hasVoted || voteLoadingId === candidate._id}
                >
                  {voteLoadingId === candidate._id ? "Submitting..." : "Vote"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VotingDashboard;
