
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import studentRoutes from "./routes/studentRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Student Management APIs
app.use("/api/students", studentRoutes);

// Teacher Registration and Login APIs
app.use("/api/auth", authRoutes);

// Home Route
app.get("/", (req, res) => {
    res.send("School Student Management System Backend is Running");
});

// Connect to MongoDB and Start Server
async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing in .env");
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Server startup error:", error.message);
        process.exit(1);
    }
}

startServer();