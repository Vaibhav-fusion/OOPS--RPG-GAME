import Leaderboard from "../models/leaderboard.model.js";
import User from "../models/user.model.js";
import logger from "../config/logger.js";
import { getCache, setCache, deleteCache } from "../utils/cache/cache.js";

const LEADERBOARD_CACHE_KEY = "leaderboard:all";
const TOP10_CACHE_KEY = "leaderboard:top10";

export const getLeaderboard = async () => {
  const cached = getCache(LEADERBOARD_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const pipeline = [
    {
      $sort: {
        totalXP: -1,
        gamesWon: -1,
        bestTime: 1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        userId: 1,
        username: "$user.username",
        totalXP: 1,
        gamesWon: 1,
        bestTime: 1,
      },
    },
  ];

  const leaderboard = await Leaderboard.aggregate(pipeline).exec();
  setCache(LEADERBOARD_CACHE_KEY, leaderboard, 60000);
  return leaderboard;
};

export const getLeaderboardTop10 = async () => {
  const cached = getCache(TOP10_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const top10 = await Leaderboard.aggregate([
    {
      $sort: {
        totalXP: -1,
        gamesWon: -1,
        bestTime: 1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        userId: 1,
        username: "$user.username",
        totalXP: 1,
        gamesWon: 1,
        bestTime: 1,
      },
    },
    { $limit: 10 },
  ]).exec();

  setCache(TOP10_CACHE_KEY, top10, 60000);
  return top10;
};

export const updateLeaderboard = async (userId, xp, completionTime) => {
  const user = await User.findById(userId, "username").lean();
  if (!user) {
    logger.warn("Leaderboard update attempted for missing user %s", userId);
    return null;
  }

  const existing = await Leaderboard.findOne({ userId }).lean();
  if (existing) {
    const updated = await Leaderboard.findOneAndUpdate(
      { userId },
      {
        $inc: { totalXP: xp, gamesWon: 1 },
        $min: { bestTime: completionTime },
      },
      { new: true },
    ).lean();
    deleteCache(LEADERBOARD_CACHE_KEY);
    deleteCache(TOP10_CACHE_KEY);
    return updated;
  }

  const record = await Leaderboard.create({
    userId,
    totalXP: xp,
    gamesWon: 1,
    bestTime: completionTime,
  });

  deleteCache(LEADERBOARD_CACHE_KEY);
  deleteCache(TOP10_CACHE_KEY);
  return record;
};
