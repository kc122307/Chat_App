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
        
        // ENFORCE 2-USER LIMIT
        if (videoRooms[roomId].participants.length >= 2) {
            console.log(`❌ User ${userName} attempted to join room ${roomId}, but it is full.`);
            io.to(socket.id).emit("room-join-error", {
                error: "Room is full. Cannot join.",
            });
            return;
        }

        const isUserAlreadyInRoom = videoRooms[roomId].participants.some(p => p.userId === userId);
        console.log(`🔍 User already in room:`, isUserAlreadyInRoom);
        
        if (!isUserAlreadyInRoom) {
            const participant = { userId, userName, socketId: socket.id };
            videoRooms[roomId].participants.push(participant);
            console.log(`➕ Added participant ${userName} to room ${roomId}`);
            console.log(`📢 Notifying other room members about ${userName} joining`);
            socket.to(roomId).emit("user-joined", { userId, userName });
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
        console.log(`📡 [BACKEND] ✅ Received sending-signal event`);
        console.log(`📡 [BACKEND] From: ${callerId} -> To: ${userToSignal}`);
        console.log(`📡 [BACKEND] Signal type:`, signal?.type || 'unknown');
        console.log(`📡 [BACKEND] Current socket ID:`, socket.id);
        console.log(`📡 [BACKEND] SocketUserMap lookup:`, socketUserMap[socket.id]);
        
        // Debug all mappings
        console.log(`📅 [BACKEND] All room mappings:`, roomUserSocketMap);
        console.log(`📅 [BACKEND] All user-socket mappings:`, userSocketMap);
        console.log(`📅 [BACKEND] All socket-user mappings:`, socketUserMap);
        
        const roomId = roomUserSocketMap[userToSignal];
        console.log(`🏠 [BACKEND] Room for target user ${userToSignal}:`, roomId);
        
        if (roomId && videoRooms[roomId]) {
            console.log(`🔍 [BACKEND] Room ${roomId} exists, looking for participant ${userToSignal}`);
            console.log(`📅 [BACKEND] Available participants in room:`, videoRooms[roomId].participants.map(p => `${p.userName}(${p.userId}) - Socket: ${p.socketId}`));
            
            const receiverSocket = videoRooms[roomId].participants.find(
                (p) => p.userId === userToSignal
            );
            
            if (receiverSocket) {
                console.log(`📤 [BACKEND] ✅ Found receiver! Sending receiving-signal to ${userToSignal} at socket ${receiverSocket.socketId}`);
                console.log(`📤 [BACKEND] Receiver details:`, {
                    userId: receiverSocket.userId,
                    userName: receiverSocket.userName,
                    socketId: receiverSocket.socketId
                });
                
                io.to(receiverSocket.socketId).emit("receiving-signal", {
                    signal,
                    callerId,
                });
                console.log(`📤 [BACKEND] ✅ receiving-signal event emitted successfully to ${receiverSocket.socketId}`);
            } else {
                console.error(`❌ [BACKEND] No receiver found for signal to ${userToSignal}`);
                console.error(`❌ [BACKEND] Available participants:`, videoRooms[roomId].participants.map(p => `${p.userName}(${p.userId})`));
            }
        } else if (!roomId) {
            console.error(`❌ [BACKEND] No room mapping found for user ${userToSignal}`);
            console.error(`❌ [BACKEND] Room mapping:`, roomUserSocketMap);
            console.error(`❌ [BACKEND] Available rooms:`, Object.keys(videoRooms));
        } else {
            console.error(`❌ [BACKEND] Room ${roomId} does not exist`);
            console.error(`❌ [BACKEND] Available rooms:`, Object.keys(videoRooms));
        }
    });

    socket.on("returning-signal", ({ signal, callerId }) => {
        console.log(`🔄 [BACKEND] Returning signal from current user (${socket.id}) to original caller ${callerId}`);
        console.log(`🔄 [BACKEND] Signal type:`, signal?.type || 'unknown');
        
        // Find current user's ID
        const currentUserId = socketUserMap[socket.id];
        console.log(`👤 [BACKEND] Current user sending return signal: ${currentUserId}`);
        
        // Find the room where the caller is located
        const roomId = roomUserSocketMap[callerId];
        console.log(`🏠 [BACKEND] Room for original caller ${callerId}:`, roomId);
        console.log(`📅 [BACKEND] All room mappings:`, roomUserSocketMap);
        
        if (roomId && videoRooms[roomId]) {
            console.log(`🔍 [BACKEND] Looking for original caller ${callerId} in room ${roomId}`);
            console.log(`📅 [BACKEND] Available participants:`, videoRooms[roomId].participants.map(p => `${p.userName}(${p.userId})`));
            
            // Find the ORIGINAL caller who should receive the return signal
            const originalCallerSocket = videoRooms[roomId].participants.find(
                (p) => p.userId === callerId
            );
            
            if (originalCallerSocket) {
                console.log(`📤 [BACKEND] ✅ Sending returning-signal to original caller ${callerId} at socket ${originalCallerSocket.socketId}`);
                io.to(originalCallerSocket.socketId).emit("returning-signal", {
                    signal,
                    callerId: currentUserId // This is the ID of who is returning the signal (current user)
                });
                console.log(`📤 [BACKEND] ✅ returning-signal event emitted successfully`);
            } else {
                console.error(`❌ [BACKEND] Original caller ${callerId} not found for returning signal`);
                console.log(`📅 [BACKEND] Available participants:`, videoRooms[roomId].participants.map(p => `${p.userName}(${p.userId})`));
            }
        } else {
            console.error(`❌ [BACKEND] Room not found for returning signal to ${callerId}`);
            console.error(`❌ [BACKEND] Room mapping:`, roomUserSocketMap);
            console.error(`❌ [BACKEND] Available rooms:`, Object.keys(videoRooms));
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