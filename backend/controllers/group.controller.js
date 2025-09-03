// src/controllers/group.controller.js
import Group from "../models/group.model.js";
import User from "../models/user.model.js";

export const createGroup = async (req, res) => {
	try {
		const { name, members } = req.body;
		const adminId = req.user._id;

		if (members.length < 2) {
			return res.status(400).json({ error: "A group must have at least 3 members, including the admin." });
		}

		// Add the admin to the list of members
		const groupMembers = [...members, adminId];

		const newGroup = new Group({
			name,
			members: groupMembers,
			admin: adminId,
		});

		await newGroup.save();

		res.status(201).json(newGroup);
	} catch (error) {
		console.log("Error in createGroup controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getGroups = async (req, res) => {
	try {
		const userId = req.user._id;
		const groups = await Group.find({ members: userId }).populate("admin", "-password").populate("members", "-password");

		res.status(200).json(groups);
	} catch (error) {
		console.log("Error in getGroups controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};