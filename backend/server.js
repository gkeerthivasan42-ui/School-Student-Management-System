import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import studentRoutes from "./routes/studentRoutes.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.send("School Student Management System Backend is Running");
});

app.use("/api/students", studentRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);

    res.status(500).json({
        message: "Internal server error"
    });
});

async function startServer() {
    if (!MONGO_URI) {
        console.error(
            "MONGO_URI is not defined. Please create backend/.env and add MONGO_URI."
        );
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

startServer();
