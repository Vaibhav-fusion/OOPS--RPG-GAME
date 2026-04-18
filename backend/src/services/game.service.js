import GameSession from "../models/gameSession.model.js";
import {
  generateBoard,
  revealTile as engineRevealTile,
  checkGameStatus,
} from "./gameEngine.js";

/**
 * Starts a new game session for the user
 * @param {string} userId - The user's ID
 * @param {number} gridSize - Size of the grid (default 10)
 * @param {string} difficulty - Difficulty level (default "medium")
 * @returns {Object} The created game session
 */
export const startNewGame = async (
  userId,
  gridSize = 10,
  difficulty = "medium",
) => {
  // Get user's current level from existing session or default to 1
  let playerLevel = 1;
  try {
    const lastGame = await GameSession.findOne({ userId }).sort({
      createdAt: -1,
    });
    if (lastGame) {
      playerLevel = lastGame.playerStats.level;
    }
  } catch (error) {
    // Ignore error, use default level
  }

  const board = generateBoard(gridSize, difficulty, playerLevel);

  const gameSession = await GameSession.create({
    userId,
    gridSize,
    board,
    revealedCells: [],
    playerStats: {
      hp: 100,
      xp: 0,
      level: playerLevel,
    },
    gameStatus: "ongoing",
  });

  return gameSession;
};

/**
 * Retrieves the current active game session for a user
 * @param {string} userId - The user's ID
 * @returns {Object} The game session
 */
export const getGameSession = async (userId) => {
  const gameSession = await GameSession.findOne({
    userId,
    gameStatus: "ongoing",
  });
  if (!gameSession) {
    const error = new Error("No active game session found.");
    error.status = 404;
    throw error;
  }
  return gameSession;
};

/**
 * Reveals a tile in the game session
 * @param {string} userId - The user's ID
 * @param {number} row - Row coordinate
 * @param {number} col - Column coordinate
 * @returns {Object} Result of the reveal action
 */
export const revealTile = async (userId, row, col) => {
  const gameSession = await getGameSession(userId);

  if (gameSession.gameStatus !== "ongoing") {
    const error = new Error("Game is not ongoing.");
    error.status = 400;
    throw error;
  }

  // Use the game engine to reveal the tile
  const result = engineRevealTile(gameSession, row, col);

  // Update revealed cells
  gameSession.revealedCells = [
    ...new Set([
      ...gameSession.revealedCells,
      ...result.revealedCells.map(([x, y]) => `${x},${y}`),
    ]),
  ].map((coord) => coord.split(",").map(Number));

  // Check and update game status
  gameSession.gameStatus = checkGameStatus(gameSession);

  await gameSession.save();

  return {
    action: result.action,
    revealedCells: result.revealedCells,
    damage: result.damage || 0,
    xpGain: result.xpGain || 0,
    playerStats: gameSession.playerStats,
    gameStatus: gameSession.gameStatus,
  };
};
