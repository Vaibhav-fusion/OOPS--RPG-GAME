import mongoose from "mongoose";

const gameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gridSize: {
      type: Number,
      required: true,
      default: 10,
    },
    board: {
      type: [[Object]], // 2D array of tile objects
      required: true,
    },
    revealedCells: {
      type: [[Number]], // Array of [row, col] positions
      default: [],
    },
    playerStats: {
      hp: {
        type: Number,
        default: 100,
      },
      xp: {
        type: Number,
        default: 0,
      },
      level: {
        type: Number,
        default: 1,
      },
    },
    gameStatus: {
      type: String,
      enum: ["ongoing", "won", "lost"],
      default: "ongoing",
    },
  },
  {
    timestamps: true,
  },
);

const GameSession =
  mongoose.models.GameSession ||
  mongoose.model("GameSession", gameSessionSchema);

export default GameSession;
