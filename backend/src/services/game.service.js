import GameSession from "../models/gameSession.model.js";
import {
  generateBoard,
  revealTile as engineRevealTile,
  checkGameStatus,
  levelUpPlayer,
  normalizeGridSize,
} from "./gameEngine.js";
import { updateLeaderboard } from "../leaderboard/leaderboard.service.js";
import { getCache, setCache, deleteCache } from "../utils/cache/cache.js";
import logger from "../config/logger.js";

const ACTIVE_SESSION_CACHE_KEY = "activeSession:";
const ACTIVE_SESSION_TTL_MS = 30000;
const SESSION_DURATION_MS = 60 * 60 * 1000;

const buildActiveSessionCacheKey = (userId) =>
  `${ACTIVE_SESSION_CACHE_KEY}${userId}`;

const findActiveSession = async (userId) =>
  GameSession.findOne({
    userId,
    gameStatus: "ongoing",
    expiresAt: { $gt: new Date() },
  }).exec();

export const startNewGame = async (
  userId,
  _gridSize = null,
  _difficulty = "medium",
  forceNew = false,
) => {
  const normalizedGridSize = normalizeGridSize();

  const existingSession = await findActiveSession(userId);
  if (existingSession && !forceNew) {
    return existingSession;
  }

  // If forcing new game and there's an existing session, mark it as completed
  if (existingSession && forceNew) {
    await GameSession.findByIdAndUpdate(existingSession._id, {
      gameStatus: "abandoned",
      expiresAt: new Date(),
    });
  }

  let playerLevel = 1;
  try {
    const lastGame = await GameSession.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (lastGame) {
      playerLevel = lastGame.playerStats.level;
    }
  } catch (error) {
    logger.warn(
      "Failed to fetch last game for user %s: %s",
      userId,
      error.message,
    );
  }

  const board = await generateBoard(normalizedGridSize, "medium", playerLevel);

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const gameSession = await GameSession.create({
    userId,
    gridSize: normalizedGridSize,
    difficulty: "medium",
    board,
    revealedCells: [[0, 0]],
    playerStats: {
      hp: 5,
      maxHp: 5,
      xp: 0,
      level: playerLevel,
    },
    gameStatus: "ongoing",
    startedAt: new Date(),
    expiresAt,
    completedAt: null,
    lastActionAt: null,
    moveCount: 0,
    suspiciousActions: 0,
  });

  deleteCache(buildActiveSessionCacheKey(userId));
  return gameSession;
};

export const getGameSession = async (userId) => {
  const cacheKey = buildActiveSessionCacheKey(userId);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const gameSession = await findActiveSession(userId);

  if (!gameSession) {
    const error = new Error("No active game session found.");
    error.status = 404;
    throw error;
  }

  const leanSession = gameSession.toObject();
  setCache(cacheKey, leanSession, ACTIVE_SESSION_TTL_MS);
  return leanSession;
};

const getActiveSessionForUpdate = async (userId) => {
  const gameSession = await findActiveSession(userId);

  if (!gameSession) {
    const error = new Error("No active game session found.");
    error.status = 404;
    throw error;
  }

  return gameSession;
};

export const revealTile = async (userId, row, col) => {
  const gameSession = await getActiveSessionForUpdate(userId);

  if (gameSession.gameStatus !== "ongoing") {
    const error = new Error("Game is not ongoing.");
    error.status = 400;
    throw error;
  }

  const now = new Date();
  if (gameSession.lastActionAt) {
    const intervalMs = now.getTime() - gameSession.lastActionAt.getTime();
    if (intervalMs < 240) {
      gameSession.suspiciousActions += 1;
      logger.warn(
        "Suspicious rapid moves detected for user %s: %dms since last action",
        userId,
        intervalMs,
      );
      const error = new Error("Actions are too fast. Please wait 0.24s.");
      error.status = 429;
      throw error;
    }
  }

  gameSession.lastActionAt = now;
  gameSession.moveCount += 1;

  if (
    row < 0 ||
    row >= gameSession.gridSize ||
    col < 0 ||
    col >= gameSession.gridSize
  ) {
    const error = new Error("Invalid tile position.");
    error.status = 400;
    throw error;
  }

  const result = engineRevealTile(gameSession, row, col);

  const existingSet = new Set(
    gameSession.revealedCells.map(([x, y]) => `${x},${y}`),
  );
  result.revealedCells.forEach(([x, y]) => existingSet.add(`${x},${y}`));
  gameSession.revealedCells = [...existingSet].map((coord) =>
    coord.split(",").map(Number),
  );

  gameSession.gameStatus = checkGameStatus(gameSession);

  if (gameSession.gameStatus === "won") {
    gameSession.completedAt = new Date();
    const completionTime =
      gameSession.completedAt.getTime() - gameSession.startedAt.getTime();
    await updateLeaderboard(userId, gameSession.playerStats.xp, completionTime);
    logger.info(
      "User %s completed a game in %dms with %d xp",
      userId,
      completionTime,
      gameSession.playerStats.xp,
    );
  }

  if (gameSession.gameStatus === "lost") {
    gameSession.completedAt = new Date();
    logger.info(
      "User %s lost a game after %d moves",
      userId,
      gameSession.moveCount,
    );
  }

  gameSession.markModified("board");
  await gameSession.save();
  deleteCache(buildActiveSessionCacheKey(userId));

  return {
    action: result.action,
    revealedCells: result.revealedCells,
    damage: result.damage || 0,
    xpGain: result.xpGain || 0,
    playerStats: gameSession.playerStats,
    gameStatus: gameSession.gameStatus,
    board: gameSession.board,
    gridSize: gameSession.gridSize,
    gameId: gameSession._id,
  };
};

export const levelUp = async (userId) => {
  const gameSession = await getActiveSessionForUpdate(userId);

  if (gameSession.gameStatus !== "ongoing") {
    const error = new Error("Game is not ongoing.");
    error.status = 400;
    throw error;
  }

  levelUpPlayer(gameSession);
  gameSession.gameStatus = checkGameStatus(gameSession);
  gameSession.markModified("board");
  await gameSession.save();
  deleteCache(buildActiveSessionCacheKey(userId));

  return {
    playerStats: gameSession.playerStats,
    gameStatus: gameSession.gameStatus,
    board: gameSession.board,
    gridSize: gameSession.gridSize,
    gameId: gameSession._id,
  };
};
