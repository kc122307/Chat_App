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
const rooms = {};
const videoRooms = {};

// New data structure for fast lookup of room participants' sockets
const roomUserSocketMap = {};

io.on("connection", (socket) => {
	console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId;
	if (userId != "undefined") userSocketMap[userId] = socket.id;

	io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Handle individual call invitation
    socket.on("call-user", ({ userToCall, signal, callType }) => {
        const receiverSocketId = userSocketMap[userToCall];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-received", {
                from: userId,
                signal: signal,
                callType: callType || 'video'
            });
        } else {
            socket.emit("call-failed", {
                error: "User is offline",
                userToCall
            });
        }
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
    
    // Video Room Functionality
    function generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    socket.on("create-video-room", ({ userId, userName }) => {
        const roomId = generateRoomCode();
        videoRooms[roomId] = {
            id: roomId,
            creatorId: userId,
            createdAt: new Date(),
            participants: [{
                userId,
                userName,
                socketId: socket.id
            }]
        };
        socket.join(roomId);

        // Add user to the roomUserSocketMap
        roomUserSocketMap[userId] = roomId;

        io.to(socket.id).emit("video-room-created", videoRooms[roomId]);
    });
    
    socket.on("check-video-room", ({ roomId }) => {
        const roomExists = !!videoRooms[roomId];
        io.to(socket.id).emit("video-room-check-result", { roomId, exists: roomExists });
    });
    
    socket.on("join-room", ({ roomId, userId, userName }) => {
        if (!videoRooms[roomId]) {
            io.to(socket.id).emit("room-join-error", { error: "Room does not exist" });
            return;
        }
        
        // Add user to the roomUserSocketMap
        roomUserSocketMap[userId] = roomId;

        const participant = { userId, userName, socketId: socket.id };
        videoRooms[roomId].participants.push(participant);
        socket.join(roomId);
        io.to(socket.id).emit("room-info", videoRooms[roomId]);
        socket.to(roomId).emit("user-joined", { userId, userName });
    });
    
    socket.on("leave-room", ({ roomId, userId }) => {
        if (videoRooms[roomId]) {
            const user = videoRooms[roomId].participants.find(p => p.userId === userId);
            videoRooms[roomId].participants = videoRooms[roomId].participants.filter(p => p.userId !== userId);
            
            if (user) {
                socket.to(roomId).emit("user-left", { userId, userName: user.userName });
            }
            
            if (videoRooms[roomId].participants.length === 0 || videoRooms[roomId].creatorId === userId) {
                io.to(roomId).emit("room-closed");
                delete videoRooms[roomId];
            }
            
            // Remove user from the roomUserSocketMap
            delete roomUserSocketMap[userId];

            socket.leave(roomId);
        }
    });
    
    // Corrected signaling events
    socket.on("sending-signal", ({ userToSignal, signal, callerId }) => {
        const roomId = roomUserSocketMap[userToSignal];
        if (roomId && videoRooms[roomId]) {
            const receiverSocket = videoRooms[roomId].participants.find(p => p.userId === userToSignal);
            if (receiverSocket) {
                io.to(receiverSocket.socketId).emit("receiving-signal", { signal, callerId });
            }
        }
    });
    
    socket.on("returning-signal", ({ signal, callerId }) => {
        const roomId = roomUserSocketMap[callerId];
        if (roomId && videoRooms[roomId]) {
            const receiverSocket = videoRooms[roomId].participants.find(p => p.userId === callerId);
            if (receiverSocket) {
                io.to(receiverSocket.socketId).emit("returning-signal", { signal, callerId });
            }
        }
    });

	socket.on("disconnect", () => {
		console.log("user disconnected", socket.id);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));

        // Clean up from the roomUserSocketMap on disconnect
        if (roomUserSocketMap[userId]) {
            delete roomUserSocketMap[userId];
        }

        for (const groupId in rooms) {
            rooms[groupId].delete(socket.id);
            if (rooms[groupId].size === 0) {
                delete rooms[groupId];
            }
        }
	});
});

export { app, io, server };