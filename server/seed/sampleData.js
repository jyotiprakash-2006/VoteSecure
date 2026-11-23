const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const path = require("path");
const User = require("../models/User");
const Candidate = require("../models/Candidate");

dotenv.config({ path: path.join(__dirname, "../.env") });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await User.deleteMany();
    await Candidate.deleteMany();

    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const userPassword = await bcrypt.hash("User@1234", 10);

    await User.create([
      {
        name: "System Admin",
        email: "admin@vote.com",
        password: adminPassword,
        role: "admin",
        hasVoted: false
      },
      {
        name: "Demo Voter",
        email: "user@vote.com",
        password: userPassword,
        role: "user",
        hasVoted: false
      }
    ]);

    await Candidate.create([
      { name: "Aarav Sharma", party: "Progressive Party", votes: 0 },
      { name: "Neha Verma", party: "United Front", votes: 0 },
      { name: "Rohan Das", party: "National Vision", votes: 0 }
    ]);

    console.log("Sample data seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seed();
