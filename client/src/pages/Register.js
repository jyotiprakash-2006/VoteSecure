import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { authService } from "../services/api";

const Register = ({ setUser }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ name: "", email: "", password: "" });
    setShowPassword(false);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill all fields.");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const { data } = await authService.register(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      toast.success(data.message);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-page">
      <div className="card p-4 shadow-sm">
        <h2 className="mb-3">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              placeholder="Your full name"
              type="text"
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              placeholder="Email"
              type="email"
              className="form-control"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          <div className="mb-3 position-relative">
            <label className="form-label">Password</label>
            <input
              placeholder="At least 6 characters"
              type={showPassword ? "text" : "password"}
              className="form-control"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              spellCheck="false"
              style={{ paddingRight: "40px" }}
            />
            <button
              type="button"
              className="btn btn-sm position-absolute"
              style={{
                top: "2.3rem",
                right: "12px",
                zIndex: 1,
                border: "none",
                background: "none",
                color: "#6c757d",
                padding: "0.25rem 0.5rem",
              }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <i className="bi bi-eye-slash"></i>
              ) : (
                <i className="bi bi-eye"></i>
              )}
            </button>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="mt-3 mb-0">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
