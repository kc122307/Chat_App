// src/routes/user.routes.js

import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSidebar, getMyProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getUsersForSidebar);
router.get("/me", protectRoute, getMyProfile);

export default router;