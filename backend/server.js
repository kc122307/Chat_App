import path from "path";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from 'cors'; 

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import groupRoutes from "./routes/group.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

dotenv.config();

const __dirname = path.resolve();
const PORT = process.env.PORT || 5000;

const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
const corsOptions = {
    origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000", "https://chat-app-nu-peach.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);

// Health check endpoint for Render
app.get("/health", (req, res) => {
	res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Root endpoint
app.get("/", (req, res) => {
	res.json({ message: "Chat App Backend API", status: "Running" });
});

// Static files and uploads (only if files exist)
if (process.env.NODE_ENV === "production") {
	// Serve static files from frontend build
	app.use(express.static(path.join(__dirname, "frontend", "dist")));
	
	// Catch-all handler: send back React's index.html file for non-API routes
	app.get("*", (req, res) => {
		// Only serve index.html if it's not an API route
		if (req.path.startsWith("/api/")) {
			return res.status(404).json({ error: "API endpoint not found" });
		}
		res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
	});
}

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

server.listen(PORT, () => {
	connectToMongoDB();
	console.log(`Server Running on port ${PORT}`);
});
