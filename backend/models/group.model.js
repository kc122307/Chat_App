// src/models/group.model.js
import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		members: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
				required: true,
			},
		],
		messages: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Message",
				default: [],
			},
		],
		admin: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
	},
	{ timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);

export default Group;