import express from "express";
import { getMessages, sendMessage} from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import upload from "../middleware/upload.js"; 

const router = express.Router();

// The specific route for "mychats" must come first
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, upload.single('media'), sendMessage);

export default router;