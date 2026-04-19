import {
  startNewGame,
  getGameSession,
  revealTile,
  levelUp,
} from "../services/game.service.js";
import { isWinPossible } from "../services/gameEngine.js";

const toRevealedGrid = (board) =>
  board.map((row) =>
    row.map((cell) =>
      cell.revealed
        ? {
            name: cell.name,
            type: cell.type,
            value: cell.value,
            danger: cell.danger || 0,
            extra: cell.extra || {},
            revealed: true,
          }
        : { revealed: false },
    ),
  );

export const startGame = async (req, res) => {
  try {
    const { forceNew = false } = req.body;
    const userId = req.user.userId;

    const gameSession = await startNewGame(userId, null, "medium", forceNew);
    const revealedGrid = toRevealedGrid(gameSession.board);

    return res.status(201).json({
      message:
        forceNew && gameSession.isNew
          ? "New game started successfully."
          : "Game started successfully.",
      game: {
        gameId: gameSession._id,
        gridSize: gameSession.gridSize,
        difficulty: "dungeon",
        revealedGrid,
        playerStats: gameSession.playerStats,
        gameStatus: gameSession.gameStatus,
        possibleToWin: isWinPossible(gameSession.board),
      },
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
    const revealedGrid = toRevealedGrid(gameSession.board);

    return res.status(200).json({
      gameId: gameSession._id,
      gridSize: gameSession.gridSize,
      difficulty: "dungeon",
      revealedGrid,
      playerStats: gameSession.playerStats,
      gameStatus: gameSession.gameStatus,
      possibleToWin: isWinPossible(gameSession.board),
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

    const revealedGrid = toRevealedGrid(result.board);

    return res.status(200).json({
      game: {
        gameId: result.gameId,
        gridSize: result.gridSize,
        difficulty: "dungeon",
        revealedGrid,
        playerStats: result.playerStats,
        gameStatus: result.gameStatus,
        possibleToWin: isWinPossible(result.board),
      },
      action: result.action,
      damage: result.damage,
      xpGain: result.xpGain,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Unable to reveal tile. Please try again later." });
  }
};

export const levelUpAction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await levelUp(userId);
    const revealedGrid = toRevealedGrid(result.board);

    return res.status(200).json({
      game: {
        gameId: result.gameId,
        gridSize: result.gridSize,
        difficulty: "dungeon",
        revealedGrid,
        playerStats: result.playerStats,
        gameStatus: result.gameStatus,
        possibleToWin: isWinPossible(result.board),
      },
      action: "level_up",
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: "Unable to level up. Please try again later." });
  }
};
