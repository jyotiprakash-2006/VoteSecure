import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  getMe: () => api.get("/auth/me")
};

export const voteService = {
  getCandidates: () => api.get("/candidates"),
  vote: (candidateId) => api.post(`/vote/${candidateId}`)
};

export const adminService = {
  addCandidate: (payload) => api.post("/admin/candidate", payload),
  updateCandidate: (id, payload) => api.put(`/admin/candidate/${id}`, payload),
  deleteCandidate: (id) => api.delete(`/admin/candidate/${id}`),
  getResults: () => api.get("/admin/results"),
  getElectionSettings: () => api.get("/admin/election-settings"),
  updateElectionSettings: (payload) => api.put("/admin/election-settings", payload),
  announceWinner: () => api.post("/admin/announce-winner"),
  startVoting: () => api.post("/admin/voting/start"),
  endVoting: () => api.post("/admin/voting/end")
};

export default api;
