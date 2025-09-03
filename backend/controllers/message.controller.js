// backend/controllers/message.controller.js (Updated)

import Conversation from "../models/conversation.model.js";
import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import path from 'path';

export const sendMessage = async (req, res) => {
	try {
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		let mediaUrl = null;
		let mediaType = 'text';
		let messageText = req.body.message;

		if (req.file) {
			const filename = req.file.filename;
			mediaUrl = `/uploads/${filename}`;
			
			const mimeType = req.file.mimetype;
			if (mimeType.startsWith('image/')) {
				mediaType = 'image';
			} else if (mimeType.startsWith('audio/')) {
				mediaType = 'audio';
			} else {
				mediaType = 'file';
			}
			messageText = req.file.originalname;
		}

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		let group = await Group.findById(receiverId);

		const newMessage = new Message({
			senderId,
			receiverId,
			message: messageText,
			media: mediaUrl,
			mediaType: mediaType,
		});

		if (group) {
			group.messages.push(newMessage._id);
			await Promise.all([group.save(), newMessage.save()]);

			group.members.forEach(memberId => {
				const memberSocketId = getReceiverSocketId(memberId);
				if (memberSocketId) {
					io.to(memberSocketId).emit("newMessage", newMessage);
				}
			});

		} else if (conversation) {
			conversation.messages.push(newMessage._id);
			await Promise.all([conversation.save(), newMessage.save()]);

			const receiverSocketId = getReceiverSocketId(receiverId);
			if (receiverSocketId) {
				io.to(receiverSocketId).emit("newMessage", newMessage);
			}

		} else {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
				messages: [newMessage._id]
			});
			await newMessage.save();

			const receiverSocketId = getReceiverSocketId(receiverId);
			if (receiverSocketId) {
				io.to(receiverSocketId).emit("newMessage", newMessage);
			}
		}

		res.status(201).json(newMessage);
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id } = req.params;
		const senderId = req.user._id;

		let chat = await Conversation.findOne({
			participants: { $all: [senderId, id] },
		}).populate("messages");

		if (chat) {
			return res.status(200).json(chat.messages);
		}

		chat = await Group.findById(id).populate("messages");
		
		if (chat && chat.members.includes(senderId)) {
			return res.status(200).json(chat.messages);
		}

		res.status(200).json([]);

	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

