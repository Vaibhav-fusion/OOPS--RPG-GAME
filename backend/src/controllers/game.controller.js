import {
  startNewGame,
  getGameSession,
  revealTile,
} from "../services/game.service.js";

export const startGame = async (req, res) => {
  try {
    const { gridSize = 10, difficulty = "medium" } = req.body;
    const userId = req.user.userId;

    if (gridSize < 5 || gridSize > 20) {
      return res
        .status(400)
        .json({ message: "Grid size must be between 5 and 20." });
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return res
        .status(400)
        .json({ message: "Difficulty must be 'easy', 'medium', or 'hard'." });
    }

    const gameSession = await startNewGame(userId, gridSize, difficulty);

    return res.status(201).json({
      message: "Game started successfully.",
      gameId: gameSession._id,
      gridSize: gameSession.gridSize,
      difficulty,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Unable to start game. Please try again later." });
  }
};

export const getGame = async (req, res) => {
  try {
    const userId = req.user.userId;

    const gameSession = await getGameSession(userId);

    // Return only revealed grid data
    const revealedGrid = gameSession.board.map((row, i) =>
      row.map((tile, j) => {
        if (tile.revealed) {
          return {
            type: tile.type,
            value: tile.value,
            danger: tile.danger || 0,
            enemyType: tile.enemyType,
            trapType: tile.trapType,
            treasureType: tile.treasureType,
          };
        }
        return null; // Hidden
      }),
    );

    return res.status(200).json({
      gameId: gameSession._id,
      gridSize: gameSession.gridSize,
      revealedGrid,
      playerStats: gameSession.playerStats,
      gameStatus: gameSession.gameStatus,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Unable to retrieve game. Please try again later." });
  }
};

export const reveal = async (req, res) => {
  try {
    const { row, col } = req.body;
    const userId = req.user.userId;

    if (typeof row !== "number" || typeof col !== "number") {
      return res.status(400).json({ message: "Row and col must be numbers." });
    }

    const result = await revealTile(userId, row, col);

    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Unable to reveal tile. Please try again later." });
  }
};
