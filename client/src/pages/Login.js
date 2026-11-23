import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { authService } from "../services/api";

const Login = ({ setUser }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({ email: "", password: "" });
    setShowPassword(false);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await authService.login(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      toast.success(data.message);
      const redirectPath = location.state?.from;
      navigate(
        redirectPath || (data.user.role === "admin" ? "/admin" : "/dashboard"),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container form-page">
      <div className="card p-4 shadow-sm">
        <h2 className="mb-3">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              placeholder="Email"
              type="email"
              className="form-control"
              name="email"
              value={form.email}
              onChange={handleChange}
              // autoComplete="off"
              spellCheck="false"
            />
          </div>
          <div className="mb-3 position-relative">
            <label className="form-label">Password</label>
            <input
              placeholder="Atleast 6 Character"
              type={showPassword ? "text" : "password"}
              className="form-control"
              name="password"
              value={form.password}
              onChange={handleChange}
              // autoComplete="new-password"
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="mt-3 mb-0">
          New user? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
