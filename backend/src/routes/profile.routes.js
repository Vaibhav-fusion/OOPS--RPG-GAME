import express from "express";
import {
  getProfile,
  updateProfile,
} from "../controllers/profile.controller.js";
import { authenticateJwt } from "../middleware/auth.middleware.js";

const router = express.Router();

// All profile routes require authentication
router.use(authenticateJwt);

router.get("/", getProfile);
router.put("/", updateProfile);

export default router;
