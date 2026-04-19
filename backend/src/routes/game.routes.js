import express from "express";
import {
  startGame,
  getGame,
  reveal,
  levelUpAction,
} from "../controllers/game.controller.js";
import { authenticateJwt } from "../middleware/auth.middleware.js";
import { revealLimiter } from "../config/rateLimiter.js";

const router = express.Router();

router.use(authenticateJwt);

router.post("/start", startGame);
router.get("/", getGame);
router.post("/reveal", revealLimiter, reveal);
router.post("/level-up", levelUpAction);

export default router;
