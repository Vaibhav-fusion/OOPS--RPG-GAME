import { getLeaderboard, getLeaderboardTop10 } from "./leaderboard.service.js";

export const fetchLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await getLeaderboard();
    res.status(200).json({ leaderboard });
  } catch (error) {
    next(error);
  }
};

export const fetchLeaderboardTop10 = async (req, res, next) => {
  try {
    const top10 = await getLeaderboardTop10();
    res.status(200).json({ top10 });
  } catch (error) {
    next(error);
  }
};
