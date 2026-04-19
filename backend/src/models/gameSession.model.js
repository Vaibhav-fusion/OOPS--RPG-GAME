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
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      default: "medium",
    },
    expiresAt: {
      type: Date,
      required: true,
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
        default: 5,
      },
      maxHp: {
        type: Number,
        default: 5,
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
      enum: ["ongoing", "won", "lost", "abandoned"],
      default: "ongoing",
    },
    startedAt: {
      type: Date,
      default: () => new Date(),
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastActionAt: {
      type: Date,
      default: null,
    },
    moveCount: {
      type: Number,
      default: 0,
    },
    suspiciousActions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

gameSessionSchema.index({ userId: 1, gameStatus: 1 });

const GameSession =
  mongoose.models.GameSession ||
  mongoose.model("GameSession", gameSessionSchema);

export default GameSession;
