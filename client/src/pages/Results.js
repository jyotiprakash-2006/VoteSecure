import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import LoadingSpinner from "../components/LoadingSpinner";
import { adminService } from "../services/api";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Results = () => {
  const [results, setResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState(null);
  const [isTie, setIsTie] = useState(false);
  const [winnerAnnounced, setWinnerAnnounced] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data } = await adminService.getResults();
        setResults(data.results);
        setTotalVotes(data.totalVotes);
        setWinner(data.winner);
        setIsTie(data.isTie);
        setWinnerAnnounced(Boolean(data.winnerAnnounced));
      } catch (error) {
        setResults([]);
        setWinner(null);
        setIsTie(false);
        setWinnerAnnounced(false);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) return <LoadingSpinner />;

  const chartData = {
    labels: results.map((c) => c.name),
    datasets: [
      {
        label: "Votes",
        data: results.map((c) => c.votes),
        backgroundColor: "rgba(13, 110, 253, 0.7)"
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: "Election Results" }
    }
  };

  const renderWinnerDeclaration = () => {
    if (!winnerAnnounced) {
      return (
        <>
          <div className="alert alert-success">You have successfully voted.</div>
          <div className="alert alert-info">Winner is not declared yet. Please wait.</div>
        </>
      );
    }

    if (!results.length) {
      return <div className="alert alert-secondary">No candidates available for winner declaration.</div>;
    }

    if (totalVotes === 0) {
      return <div className="alert alert-warning">Winner cannot be declared yet. No votes have been cast.</div>;
    }

    if (isTie && Array.isArray(winner) && winner.length) {
      return (
        <div className="alert alert-warning">
          <strong>Tie Result:</strong>{" "}
          {winner.map((candidate) => `${candidate.name} (${candidate.party})`).join(", ")} with{" "}
          {winner[0].votes} votes each.
        </div>
      );
    }

    if (winner && !Array.isArray(winner)) {
      return (
        <div className="alert alert-success">
          <strong>Winner Declared:</strong> {winner.name} ({winner.party}) with {winner.votes} votes.
        </div>
      );
    }

    return <div className="alert alert-secondary">Winner data is currently unavailable.</div>;
  };

  return (
    <div className="container">
      <h2 className="mb-3">Results Dashboard</h2>
      {renderWinnerDeclaration()}
      {winnerAnnounced && (
        <>
          <div className="alert alert-info">Total Votes Cast: {totalVotes}</div>
          <div className="card p-3 shadow-sm mb-4">
            <Bar data={chartData} options={chartOptions} />
          </div>
          <div className="card p-3 shadow-sm">
            <h5 className="mb-3">Candidate-wise Results</h5>
            <ul className="list-group">
              {results.map((candidate) => (
                <li
                  key={candidate._id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>
                    {candidate.name} ({candidate.party})
                  </span>
                  <span className="badge bg-primary rounded-pill">{candidate.votes}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default Results;
