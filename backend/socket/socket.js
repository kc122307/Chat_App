import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const frontendUrl = process.env.CORS_ORIGIN;

const io = new Server(server, {
    cors: {
        origin: frontendUrl,
        methods: ["GET", "POST"],
        credentials: true,
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
    console.log("a user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId !== "undefined") {
        userSocketMap[userId] = socket.id;
        socketUserMap[socket.id] = userId;
    }

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
        const roomId = generateRoomCode();
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

        io.to(socket.id).emit("video-room-created", videoRooms[roomId]);
    });

    socket.on("check-video-room", ({ roomId }) => {
        const roomExists = !!videoRooms[roomId];
        io.to(socket.id).emit("video-room-check-result", {
            roomId,
            exists: roomExists,
        });
    });

    socket.on("join-room", ({ roomId, userId, userName }) => {
        if (!videoRooms[roomId]) {
            io.to(socket.id).emit("room-join-error", {
                error: "Room does not exist",
            });
            return;
        }

        // ENFORCE 2-USER LIMIT
        if (videoRooms[roomId].participants.length >= 2) {
            console.log(`User ${userName} attempted to join room ${roomId}, but it is full.`);
            io.to(socket.id).emit("room-join-error", {
                error: "Room is full. Cannot join.",
            });
            return;
        }

        const isUserAlreadyInRoom = videoRooms[roomId].participants.some(p => p.userId === userId);
        
        if (!isUserAlreadyInRoom) {
            const participant = { userId, userName, socketId: socket.id };
            videoRooms[roomId].participants.push(participant);
            socket.to(roomId).emit("user-joined", { userId, userName });
        }
        
        socket.join(roomId);
        io.to(socket.id).emit("room-info", videoRooms[roomId]);
        roomUserSocketMap[userId] = roomId;
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
        const roomId = roomUserSocketMap[userToSignal];
        if (roomId && videoRooms[roomId]) {
            const receiverSocket = videoRooms[roomId].participants.find(
                (p) => p.userId === userToSignal
            );
            if (receiverSocket) {
                io.to(receiverSocket.socketId).emit("receiving-signal", {
                    signal,
                    callerId,
                });
            }
        }
    });

    socket.on("returning-signal", ({ signal, callerId }) => {
        const roomId = roomUserSocketMap[callerId];
        if (roomId && videoRooms[roomId]) {
            const receiverSocket = videoRooms[roomId].participants.find(
                (p) => p.userId === callerId
            );
            if (receiverSocket) {
                io.to(receiverSocket.socketId).emit("returning-signal", {
                    signal,
                    callerId,
                });
            }
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