// src/controllers/user.controller.js

import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
	try {
		const loggedInUserId = req.user._id;
		// Find all users except the one who is logged in
		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
// New function to get the logged-in user's profile
export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error in getMyProfile: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};