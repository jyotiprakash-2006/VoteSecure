# Secure Online Voting System (MERN)

A production-ready final-year project built with **MongoDB, Express.js, React.js, and Node.js**.  
It supports secure authentication, one-person-one-vote enforcement, candidate management for admins, and visual election analytics.

## Project Structure

```text
voting-system/
|
├── client/                  (React Frontend)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles/
│   └── package.json
|
├── server/                  (Node.js Backend)
│   ├── models/
│   │   ├── User.js
│   │   └── Candidate.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── voteRoutes.js
│   │   └── adminRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── voteController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── config/
│   │   └── db.js
│   ├── seed/
│   │   └── sampleData.js
│   ├── server.js
│   ├── .env
│   └── .env.example
|
└── README.md
```

## Tech Stack

- **Frontend:** React, React Router DOM, Axios, Bootstrap, React Toastify, Chart.js
- **Backend:** Node.js, Express, Mongoose, bcryptjs, jsonwebtoken, cors, dotenv
- **Database:** MongoDB

## Features

- User Registration & Login (JWT-based)
- Password hashing with bcrypt
- Protected user and admin routes
- One user can vote only once (`hasVoted` enforcement)
- Candidate listing + vote action
- Admin can create, update, delete candidates
- Results dashboard with bar chart
- Loading spinner and toast notifications
- Logout and session handling via `localStorage`
- Responsive UI for mobile and desktop

---

## Backend API

### Auth Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (protected)

### Voting Routes
- `GET /api/candidates`
- `POST /api/vote/:candidateId` (protected)

### Admin Routes
- `POST /api/admin/candidate` (admin)
- `PUT /api/admin/candidate/:id` (admin)
- `DELETE /api/admin/candidate/:id` (admin)
- `GET /api/admin/results`

---

## MongoDB Schemas

### User
- `name: String`
- `email: String (unique)`
- `password: String (hashed)`
- `hasVoted: Boolean (default false)`
- `role: "user" | "admin"`

### Candidate
- `name: String`
- `party: String`
- `votes: Number (default 0)`

---

## JWT Authentication (Viva Explanation)

1. User logs in with email/password.
2. Server verifies credentials and generates a JWT containing user id and role.
3. Frontend stores the token in `localStorage`.
4. Axios interceptor automatically sends `Authorization: Bearer <token>` with protected API calls.
5. `authMiddleware` verifies token and attaches user data to `req.user`.
6. `adminOnly` middleware blocks non-admin access to admin APIs.

This gives stateless, scalable authentication and role-based authorization.

---

## Voting Logic (Viva Explanation)

When a user submits vote:

1. Backend tries to update user where `{ _id: userId, hasVoted: false }`.
2. If no user is updated, vote is blocked (`already voted`).
3. If user update succeeds, selected candidate `votes` is incremented by 1.
4. If candidate does not exist, user `hasVoted` is reverted to `false`.

This prevents duplicate voting and ensures vote integrity.

---

## Security Measures

- Passwords are hashed with **bcrypt** before storing.
- JWT middleware protects private endpoints.
- Admin middleware protects candidate management routes.
- Input checks for required fields and password length.
- Duplicate voting is prevented at DB update level (`hasVoted` guard).
- CORS + JSON parsing enabled securely in Express.

---

## Environment Variables

Use `server/.env` (copy from `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/secure-voting-db
JWT_SECRET=your_super_secret_jwt_key
```

---

## Sample Data

Seed script: `server/seed/sampleData.js`

### Seeded Users
- Admin: `admin@vote.com` / `Admin@123`
- Voter: `user@vote.com` / `User@1234`

### Seeded Candidates
- Aarav Sharma (Progressive Party)
- Neha Verma (United Front)
- Rohan Das (National Vision)

---

## Run Instructions (Step-by-Step)

### 1) Clone / Open project
Open `voting-system` in your IDE.

### 2) Setup backend
```bash
cd server
npm install
```

Create `.env` in `server`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/secure-voting-db
JWT_SECRET=replace_with_a_secure_random_secret
```

Run backend:
```bash
npm run dev
```

### 3) Seed sample data (optional but recommended)
In a new terminal:
```bash
cd server
npm run seed
```

### 4) Setup frontend
```bash
cd client
npm install
npm start
```

Frontend URL: `http://localhost:3000`  
Backend URL: `http://localhost:5000`

---

## Production Notes

- Use a strong random `JWT_SECRET`.
- Use MongoDB Atlas in production.
- Set CORS origin to your frontend domain only.
- Add HTTPS, rate-limiting, and request logging for deployment.

---

## Final-Year Submission Checklist

- [x] MERN stack architecture
- [x] MVC backend structure
- [x] JWT authentication + authorization
- [x] Duplicate vote prevention
- [x] Admin candidate management
- [x] Result visualization with Chart.js
- [x] Responsive UI + form validation
- [x] Modular code structure

This project is ready for final-year project demonstration and viva.
