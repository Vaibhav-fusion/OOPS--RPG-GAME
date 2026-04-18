import express from "express";
import { startGame, getGame, reveal } from "../controllers/game.controller.js";
import { authenticateJwt } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticateJwt);

router.post("/start", startGame);
router.get("/", getGame);
router.post("/reveal", reveal);

export default router;
