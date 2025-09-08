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
const videoRooms = {}; // Maps roomId to room information for video chat rooms

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
    
    // Video Room Functionality
    
    // Generate a random 6-character room code
    function generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    // Create a new video room
    socket.on("create-video-room", ({ userId, userName }) => {
        const roomId = generateRoomCode();
        
        // Create room with creator info
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
        
        // Join the socket room
        socket.join(roomId);
        
        // Send room info back to creator
        socket.emit("video-room-created", videoRooms[roomId]);
    });
    
    // Check if a room exists
    socket.on("check-video-room", ({ roomId }) => {
        const roomExists = !!videoRooms[roomId];
        socket.emit("video-room-check-result", { roomId, exists: roomExists });
    });
    
    // Join an existing video room
    socket.on("join-room", ({ roomId, userId, userName }) => {
        // Check if room exists
        if (!videoRooms[roomId]) {
            socket.emit("room-join-error", { error: "Room does not exist" });
            return;
        }
        
        // Add user to room participants
        const participant = {
            userId,
            userName,
            socketId: socket.id
        };
        
        videoRooms[roomId].participants.push(participant);
        
        // Join the socket room
        socket.join(roomId);
        
        // Send room info to the user who joined
        socket.emit("room-info", videoRooms[roomId]);
        
        // Notify others in the room
        socket.to(roomId).emit("user-joined", { userId, userName });
    });
    
    // Leave a video room
    socket.on("leave-room", ({ roomId, userId }) => {
        if (videoRooms[roomId]) {
            // Remove user from participants
            videoRooms[roomId].participants = videoRooms[roomId].participants.filter(
                p => p.userId !== userId
            );
            
            // Notify others
            const user = videoRooms[roomId].participants.find(p => p.userId === userId);
            if (user) {
                socket.to(roomId).emit("user-left", { userId, userName: user.userName });
            }
            
            // If room is empty or creator left, delete the room
            if (videoRooms[roomId].participants.length === 0 || 
                videoRooms[roomId].creatorId === userId) {
                
                // Notify all users that the room is closed
                io.to(roomId).emit("room-closed");
                
                // Delete the room
                delete videoRooms[roomId];
            }
            
            // Leave the socket room
            socket.leave(roomId);
        }
    });
    
    // WebRTC signaling for video rooms
    socket.on("send-signal", ({ to, from, signal }) => {
        io.to(to).emit("receive-signal", { from, signal });
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
