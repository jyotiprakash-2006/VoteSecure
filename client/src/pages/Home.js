import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Home = ({ user }) => {
  const navigate = useNavigate();

  const handleViewResults = () => {
    if (!user) {
      navigate("/login", { state: { from: "/results" } });
      return;
    }
    navigate("/results");
  };

  return (
    <div className="container">
      <div className="hero-box text-center">
        <h1 className="mb-3">Secure Online Voting System</h1>
        <p className="lead mb-4">
          A transparent and secure MERN-based voting platform with authentication,
          one-vote enforcement, and real-time results.
        </p>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Link to="/register" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <button type="button" className="btn btn-outline-primary btn-lg" onClick={handleViewResults}>
            View Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
