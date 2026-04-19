import express from "express";
import {
  fetchLeaderboard,
  fetchLeaderboardTop10,
} from "./leaderboard.controller.js";

const router = express.Router();

router.get("/", fetchLeaderboard);
router.get("/top10", fetchLeaderboardTop10);

export default router;
