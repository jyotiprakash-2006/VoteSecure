import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { adminService, voteService } from "../services/api";

const initialForm = { name: "", party: "" };

const AdminDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [winnerAnnounced, setWinnerAnnounced] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [votingActive, setVotingActive] = useState(false);
  const [votingActionLoading, setVotingActionLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const toDateTimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const fetchCandidates = async () => {
    try {
      const { data } = await voteService.getCandidates();
      setCandidates(data);
    } catch (error) {
      toast.error("Failed to fetch candidates.");
    }
  };

  const fetchElectionSettings = async () => {
    try {
      const { data } = await adminService.getElectionSettings();
      setDeadline(toDateTimeLocal(data.deadline));
      setWinnerAnnounced(Boolean(data.winnerAnnounced));
      setVotingActive(Boolean(data.votingActive));
    } catch (error) {
      toast.error("Failed to fetch election settings.");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCandidates(), fetchElectionSettings()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.party) {
      toast.error("Name and party are required.");
      return;
    }

    try {
      if (editId) {
        await adminService.updateCandidate(editId, form);
        toast.success("Candidate updated successfully.");
      } else {
        await adminService.addCandidate(form);
        toast.success("Candidate added successfully.");
      }
      resetForm();
      await fetchCandidates();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed.");
    }
  };

  const onEdit = (candidate) => {
    setEditId(candidate._id);
    setForm({ name: candidate.name, party: candidate.party });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this candidate?")) return;
    try {
      await adminService.deleteCandidate(id);
      toast.success("Candidate deleted.");
      await fetchCandidates();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed.");
    }
  };

  const handleDeadlineSave = async () => {
    if (!deadline) {
      toast.error("Please select a deadline.");
      return;
    }

    try {
      const { data } = await adminService.updateElectionSettings({
        deadline: new Date(deadline).toISOString()
      });
      setWinnerAnnounced(Boolean(data.winnerAnnounced));
      setVotingActive(Boolean(data.votingActive));
      toast.success(data.message || "Deadline saved.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save deadline.");
    }
  };

  const handleAnnounceWinner = async () => {
    try {
      setAnnouncing(true);
      const { data } = await adminService.announceWinner();
      setWinnerAnnounced(true);
      toast.success(data.message || "Winner announced.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to announce winner.");
    } finally {
      setAnnouncing(false);
    }
  };

  const handleStartVoting = async () => {
    try {
      setVotingActionLoading(true);
      const { data } = await adminService.startVoting();
      setVotingActive(Boolean(data.votingActive));
      toast.success(data.message || "Voting started.");
      await fetchElectionSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start voting.");
    } finally {
      setVotingActionLoading(false);
    }
  };

  const handleEndVoting = async () => {
    try {
      setVotingActionLoading(true);
      const { data } = await adminService.endVoting();
      setVotingActive(Boolean(data.votingActive));
      toast.success(data.message || "Voting ended.");
      await fetchElectionSettings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to end voting.");
    } finally {
      setVotingActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const deadlinePassed = deadline ? new Date(deadline).getTime() <= now : false;
  const canAnnounceWinner = Boolean(deadline) && deadlinePassed && !winnerAnnounced;

  return (
    <div className="container">
      <h2 className="mb-3">Admin Dashboard</h2>

      <div className="card p-3 shadow-sm mb-4">
        <h5 className="mb-3">Election Controls</h5>
        <div className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="form-label">Voting Deadline</label>
            <input
              type="datetime-local"
              className="form-control"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className="col-md-3 d-grid">
            <button className="btn btn-outline-primary" type="button" onClick={handleDeadlineSave}>
              Save Deadline
            </button>
          </div>
          <div className="col-md-3 d-grid">
            <button
              className="btn btn-success"
              type="button"
              onClick={handleAnnounceWinner}
              disabled={!canAnnounceWinner || announcing}
            >
              {announcing ? "Announcing..." : winnerAnnounced ? "Winner Announced" : "Announce Winner"}
            </button>
          </div>
        </div>
        <div className="row g-2 mt-2">
          <div className="col-md-3 d-grid">
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleStartVoting}
              disabled={votingActionLoading}
            >
              {votingActionLoading && !votingActive ? "Starting..." : "Start Vote"}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <small className="text-muted d-block">
            Current deadline: {deadline ? new Date(deadline).toLocaleString() : "Not set"}
          </small>
          <small className="text-muted d-block">
            Winner status: {winnerAnnounced ? "Announced" : "Not announced"}
          </small>
          <small className="text-muted d-block">
            Voting status: {votingActive ? "Active" : "Inactive"}
          </small>
          {!deadlinePassed && deadline && (
            <small className="text-warning d-block">Winner can be announced only after deadline.</small>
          )}
        </div>
      </div>

      <div className="card p-3 shadow-sm mb-4">
        <h5>{editId ? "Edit Candidate" : "Add Candidate"}</h5>
        <form className="row g-2" onSubmit={handleSubmit}>
          <div className="col-md-5">
            <input
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Candidate name"
            />
          </div>
          <div className="col-md-5">
            <input
              className="form-control"
              name="party"
              value={form.party}
              onChange={handleChange}
              placeholder="Party name"
            />
          </div>
          <div className="col-md-2 d-grid">
            <button className="btn btn-primary" type="submit">
              {editId ? "Update" : "Add"}
            </button>
          </div>
        </form>
        {editId && (
          <button className="btn btn-link p-0 mt-2 text-start" onClick={resetForm}>
            Cancel edit
          </button>
        )}
      </div>

      <div className="card p-3 shadow-sm">
        <h5 className="mb-3">Candidates</h5>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Party</th>
                <th>Votes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate._id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.party}</td>
                  <td>{candidate.votes}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => onEdit(candidate)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(candidate._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!candidates.length && (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No candidates available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
