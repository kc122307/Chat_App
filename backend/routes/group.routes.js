// src/routes/group.routes.js
import express from "express";
import { createGroup, getGroups } from "../controllers/group.controller.js";
import protectRoute from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);

export default router;