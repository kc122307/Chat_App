import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";

const io = new Server(server, {
    cors: {
        origin: [frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000", "https://chat-app-nu-peach.vercel.app"],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
    },
});

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

const userSocketMap = {};
const rooms = {};
const videoRooms = {};
const socketUserMap = {};

const roomUserSocketMap = {};

io.on("connection", (socket) => {
    console.log("🔗 User connected with socket ID:", socket.id);
    console.log("🌍 Total connected sockets:", io.engine.clientsCount);

    const userId = socket.handshake.query.userId;
    console.log("👤 User ID from handshake:", userId);
    
    if (userId !== "undefined") {
        // Check if user already has a socket connection
        const existingSocketId = userSocketMap[userId];
        if (existingSocketId && existingSocketId !== socket.id) {
            console.log("⚠️ User", userId, "already has socket", existingSocketId, "- replacing with new socket", socket.id);
        }
        
        userSocketMap[userId] = socket.id;
        socketUserMap[socket.id] = userId;
        console.log("📊 Updated user mapping - userId:", userId, "socketId:", socket.id);
    } else {
        console.warn("⚠️ No valid userId provided in handshake query");
    }

    console.log("📊 Current online users:", Object.keys(userSocketMap));
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("call-user", ({ userToCall, signal, callType }) => {
        const receiverSocketId = userSocketMap[userToCall];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-received", {
                from: userId,
                signal: signal,
                callType: callType || "video",
            });
        } else {
            socket.emit("call-failed", {
                error: "User is offline",
                userToCall,
            });
        }
    });

    socket.on("call-accepted", ({ to, signal }) => {
        const callerSocketId = userSocketMap[to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call-accepted", {
                from: userId,
                signal: signal,
            });
        }
    });

    socket.on("call-rejected", ({ to }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call-rejected");
        }
    });

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

    function generateRoomCode() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    socket.on("create-video-room", ({ userId, userName }) => {
        console.log(`🏠 Creating video room for user: ${userName} (${userId})`);
        
        if (!userId || !userName) {
            console.error("❌ Missing userId or userName for room creation");
            io.to(socket.id).emit("room-error", { message: "Missing user information" });
            return;
        }
        
        const roomId = generateRoomCode();
        console.log(`✅ Generated room code: ${roomId}`);
        
        videoRooms[roomId] = {
            id: roomId,
            creatorId: userId,
            createdAt: new Date(),
            participants: [
                {
                    userId,
                    userName,
                    socketId: socket.id,
                },
            ],
        };
        
        socket.join(roomId);
        roomUserSocketMap[userId] = roomId;
        
        console.log(`📤 Emitting video-room-created event for room: ${roomId}`);
        io.to(socket.id).emit("video-room-created", videoRooms[roomId]);
        
        console.log(`📊 Current video rooms:`, Object.keys(videoRooms));
    });

    socket.on("check-video-room", ({ roomId }) => {
        console.log(`🔍 [BACKEND] Checking room existence for: ${roomId}`);
        console.log(`📅 [BACKEND] Available rooms:`, Object.keys(videoRooms));
        
        const roomExists = !!videoRooms[roomId];
        
        if (roomExists) {
            console.log(`✅ [BACKEND] Room ${roomId} exists with ${videoRooms[roomId].participants.length} participants`);
            console.log(`📅 [BACKEND] Room participants:`, videoRooms[roomId].participants.map(p => `${p.userName}(${p.userId})`));
        } else {
            console.log(`❌ [BACKEND] Room ${roomId} does not exist`);
        }
        
        io.to(socket.id).emit("video-room-check-result", {
            roomId,
            exists: roomExists,
        });
    });

    socket.on("join-room", ({ roomId, userId, userName }) => {
        console.log(`💪 Attempting to join room: ${roomId} for user: ${userName} (${userId})`);
        console.log(`📄 Room exists:`, !!videoRooms[roomId]);
        
        if (!videoRooms[roomId]) {
            console.error(`❌ Room ${roomId} does not exist`);
            io.to(socket.id).emit("room-join-error", {
                error: "Room does not exist",
            });
            return;
        }

        console.log(`📅 Current participants in room ${roomId}:`, videoRooms[roomId].participants.map(p => `${p.userName}(${p.userId})`));
        
        // CHECK IF USER IS ALREADY IN ROOM FIRST
        const isUserAlreadyInRoom = videoRooms[roomId].participants.some(p => p.userId === userId);
        console.log(`🔍 User already in room:`, isUserAlreadyInRoom);
        
        // ENFORCE 2-USER LIMIT (but only for NEW users, not existing ones)
        if (!isUserAlreadyInRoom && videoRooms[roomId].participants.length >= 2) {
            console.log(`❌ User ${userName} attempted to join room ${roomId}, but it is full.`);
            io.to(socket.id).emit("room-join-error", {
                error: "Room is full. Cannot join.",
            });
            return;
        }
        
        if (!isUserAlreadyInRoom) {
            const participant = { userId, userName, socketId: socket.id };
            videoRooms[roomId].participants.push(participant);
            console.log(`➕ Added participant ${userName} to room ${roomId}`);
            console.log(`📢 Notifying other room members about ${userName} joining`);
            console.log(`🎉 ROOM NOW HAS ${videoRooms[roomId].participants.length} PARTICIPANTS!`);
            
            // IMPORTANT: Emit to other users in the room
            socket.to(roomId).emit("user-joined", { userId, userName });
            console.log(`📤 user-joined event sent to room ${roomId}`);
        } else {
            console.log(`🔄 User ${userName} is already in room, updating socket ID`);
            // Update socket ID for existing participant
            const participant = videoRooms[roomId].participants.find(p => p.userId === userId);
            if (participant) {
                participant.socketId = socket.id;
            }
        }
        
        console.log(`🚪 Joining socket to room ${roomId}`);
        socket.join(roomId);
        
        console.log(`📤 Sending room-info to ${userName}`);
        console.log(`📊 Room info being sent:`, {
            id: videoRooms[roomId].id,
            participantCount: videoRooms[roomId].participants.length,
            participants: videoRooms[roomId].participants.map(p => `${p.userName}(${p.userId})`)
        });
        
        io.to(socket.id).emit("room-info", videoRooms[roomId]);
        roomUserSocketMap[userId] = roomId;
        
        console.log(`✅ Successfully processed join-room for ${userName}`);
    });
    
    socket.on("rejoin-room", ({ roomId, userId, userName }) => {
        console.log(`🔄 [BACKEND] User ${userName} (${userId}) rejoining room ${roomId} after reconnection`);
        
        if (!videoRooms[roomId]) {
            console.error(`❌ [BACKEND] Room ${roomId} no longer exists for rejoin`);
            return;
        }
        
        // Find and update the participant's socket ID
        const participant = videoRooms[roomId].participants.find(p => p.userId === userId);
        if (participant) {
            console.log(`🔄 [BACKEND] Updating socket ID for ${userName} from ${participant.socketId} to ${socket.id}`);
            participant.socketId = socket.id;
        } else {
            console.log(`➕ [BACKEND] Adding ${userName} back to room ${roomId}`);
            videoRooms[roomId].participants.push({ userId, userName, socketId: socket.id });
        }
        
        // Update room mapping
        roomUserSocketMap[userId] = roomId;
        socket.join(roomId);
        
        // Send updated room info
        io.to(socket.id).emit("room-info", videoRooms[roomId]);
        
        console.log(`✅ [BACKEND] Successfully processed rejoin for ${userName}`);
    });

    socket.on("leave-room", ({ roomId, userId }) => {
        if (videoRooms[roomId]) {
            const user = videoRooms[roomId].participants.find(
                (p) => p.userId === userId
            );

            videoRooms[roomId].participants = videoRooms[roomId].participants.filter(
                (p) => p.userId !== userId
            );

            if (user) {
                socket.to(roomId).emit("user-left", { userId, userName: user.userName });
            }

            if (videoRooms[roomId].participants.length === 0) {
                io.to(roomId).emit("room-closed");
                delete videoRooms[roomId];
            }

            delete roomUserSocketMap[userId];
            socket.leave(roomId);
        }
    });

    socket.on("sending-signal", ({ userToSignal, signal, callerId }) => {
        console.log(`📡 [BACKEND SIGNALING] === SENDING SIGNAL DEBUG ===`);
        console.log(`📡 [BACKEND SIGNALING] From: ${callerId}`);
        console.log(`📡 [BACKEND SIGNALING] To: ${userToSignal}`);
        console.log(`📡 [BACKEND SIGNALING] Signal type:`, signal?.type);
        console.log(`📡 [BACKEND SIGNALING] Current socket ID: ${socket.id}`);
        console.log(`📡 [BACKEND SIGNALING] UserSocketMap contents:`, Object.entries(userSocketMap).map(([user, sock]) => `${user}:${sock}`));
        console.log(`📡 [BACKEND SIGNALING] SocketUserMap contents:`, Object.entries(socketUserMap).map(([sock, user]) => `${sock}:${user}`));
        
        // SIMPLE APPROACH: Just find the target socket and send the signal
        const targetSocketId = userSocketMap[userToSignal];
        console.log(`📡 [BACKEND SIGNALING] Looking for user: ${userToSignal}`);
        console.log(`📡 [BACKEND SIGNALING] Found socket ID: ${targetSocketId}`);
        
        if (targetSocketId) {
            console.log(`🚀 [BACKEND SIGNALING] ✅ Target found! Forwarding signal to socket: ${targetSocketId}`);
            console.log(`🚀 [BACKEND SIGNALING] About to emit 'receiving-signal' event`);
            
            io.to(targetSocketId).emit("receiving-signal", {
                signal,
                callerId,
            });
            
            console.log(`✅ [BACKEND SIGNALING] 🎯 Signal forwarded successfully from ${callerId} to ${userToSignal}!`);
            console.log(`✅ [BACKEND SIGNALING] === END SENDING SIGNAL ===\n`);
        } else {
            console.error(`❌ [BACKEND SIGNALING] 💥 CRITICAL ERROR: User ${userToSignal} not found in userSocketMap!`);
            console.error(`❌ [BACKEND SIGNALING] Available users in map:`, Object.keys(userSocketMap));
            console.error(`❌ [BACKEND SIGNALING] Expected user: ${userToSignal}`);
            console.error(`❌ [BACKEND SIGNALING] Type of expected user: ${typeof userToSignal}`);
            
            // Try to find close matches
            const availableUsers = Object.keys(userSocketMap);
            const closeMatches = availableUsers.filter(u => u.includes(userToSignal.slice(-4)) || userToSignal.includes(u.slice(-4)));
            if (closeMatches.length > 0) {
                console.error(`❌ [BACKEND SIGNALING] Possible close matches:`, closeMatches);
            }
            console.error(`❌ [BACKEND SIGNALING] === END SENDING SIGNAL (FAILED) ===\n`);
        }
    });

    socket.on("returning-signal", ({ signal, callerId }) => {
        console.log(`🔄 [BACKEND SIGNALING] === RETURNING SIGNAL DEBUG ===`);
        console.log(`🔄 [BACKEND SIGNALING] Return signal TO: ${callerId}`);
        console.log(`🔄 [BACKEND SIGNALING] Signal type:`, signal?.type);
        console.log(`🔄 [BACKEND SIGNALING] Current socket ID: ${socket.id}`);
        
        // SIMPLE: Just find the caller's socket and send the return signal
        const callerSocketId = userSocketMap[callerId];
        const currentUserId = socketUserMap[socket.id];
        
        console.log(`🔄 [BACKEND SIGNALING] Looking for caller: ${callerId}`);
        console.log(`🔄 [BACKEND SIGNALING] Found caller socket ID: ${callerSocketId}`);
        console.log(`🔄 [BACKEND SIGNALING] Current user ID (responding): ${currentUserId}`);
        
        if (callerSocketId) {
            console.log(`🚀 [BACKEND SIGNALING] ✅ Caller found! Sending return signal to socket: ${callerSocketId}`);
            console.log(`🚀 [BACKEND SIGNALING] About to emit 'returning-signal' event`);
            
            io.to(callerSocketId).emit("returning-signal", {
                signal,
                callerId: currentUserId
            });
            
            console.log(`✅ [BACKEND SIGNALING] 🎯 Return signal sent successfully from ${currentUserId} to ${callerId}!`);
            console.log(`✅ [BACKEND SIGNALING] === END RETURNING SIGNAL ===\n`);
        } else {
            console.error(`❌ [BACKEND SIGNALING] 💥 CRITICAL ERROR: Caller ${callerId} not found in userSocketMap!`);
            console.error(`❌ [BACKEND SIGNALING] Available users in map:`, Object.keys(userSocketMap));
            console.error(`❌ [BACKEND SIGNALING] === END RETURNING SIGNAL (FAILED) ===\n`);
        }
    });

    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        const userId = socketUserMap[socket.id];
        if (userId) {
            delete userSocketMap[userId];
            delete socketUserMap[socket.id];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));

            const roomId = roomUserSocketMap[userId];
            if (roomId && videoRooms[roomId]) {
                const user = videoRooms[roomId].participants.find((p) => p.userId === userId);
                videoRooms[roomId].participants = videoRooms[roomId].participants.filter(
                    (p) => p.userId !== userId
                );

                if (user) {
                    socket.to(roomId).emit("user-left", { userId, userName: user.userName });
                }

                if (videoRooms[roomId].participants.length === 0) {
                    io.to(roomId).emit("room-closed");
                    delete videoRooms[roomId];
                }
            }
            delete roomUserSocketMap[userId];
        }
    });
});

export { app, io, server };