import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Use the environment variable for the CORS origin
const frontendUrl = process.env.CORS_ORIGIN;

const io = new Server(server, {
	cors: {
		origin: frontendUrl,
		methods: ["GET", "POST"],
        credentials: true
	},
});

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

const userSocketMap = {}; 
const rooms = {}; // Maps groupId to a list of connected sockets

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId;
	if (userId != "undefined") userSocketMap[userId] = socket.id;

	io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Handle individual call invitation
    socket.on("call-user", ({ userToCall, signal, callType }) => {
        const receiverSocketId = userSocketMap[userToCall];
        if (receiverSocketId) {
            // User is online, send the call signal
            io.to(receiverSocketId).emit("call-received", {
                from: userId,
                signal: signal,
                callType: callType || 'video' // Default to video if not specified
            });
        } else {
            // User is offline, notify the caller
            socket.emit("call-failed", {
                error: "User is offline",
                userToCall
            });
        }
    });

    // Handle group call invitation
    socket.on("start-group-call", ({ groupId, participants }) => {
        if (!rooms[groupId]) {
            rooms[groupId] = new Set();
        }
        rooms[groupId].add(socket.id);

        participants.forEach(participantId => {
            const memberSocketId = userSocketMap[participantId];
            if (memberSocketId && memberSocketId !== socket.id) {
                io.to(memberSocketId).emit("group-call-invite", {
                    from: userId,
                    groupId: groupId
                });
            }
        });
    });

    // Handle call acceptance
    socket.on("call-accepted", ({ to, signal }) => {
        const callerSocketId = userSocketMap[to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-accepted", {
                from: userId,
                signal: signal
            });
        }
    });

    // Handle call rejection
    socket.on("call-rejected", ({ to }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-rejected");
        }
    });
    
    // Handle end call
    socket.on("end-call", ({ to, isGroup }) => {
        if (isGroup) {
            if (rooms[to]) {
                io.to(to).emit("call-ended");
                delete rooms[to];
            }
        } else {
            const receiverSocketId = userSocketMap[to];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call-ended");
            }
        }
    });

	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));

        // Clean up group rooms on disconnect
        for (const groupId in rooms) {
            rooms[groupId].delete(socket.id);
            if (rooms[groupId].size === 0) {
                delete rooms[groupId];
            }
        }
	});
});

export { app, io, server };
