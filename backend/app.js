import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./src/modules/auth/auth.routes.js";
import gameRoutes from "./src/routes/game.routes.js";
import leaderboardRoutes from "./src/leaderboard/leaderboard.routes.js";
import profileRoutes from "./src/routes/profile.routes.js";
import { authLimiter } from "./src/config/rateLimiter.js";
import logger from "./src/config/logger.js";
import { errorHandler } from "./src/middleware/error.middleware.js";

const app = express();
app.use(express.json());

// Configure CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5175",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  logger.info("%s %s", req.method, req.originalUrl);
  next();
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/profile", profileRoutes);

app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ status: "ok", message: "Dungeonsweeper backend is running." });
});

app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found." });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/game-jus-auth";

let server;

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info("Connected to MongoDB");

    server = app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server: %s", error.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  logger.info("Shutting down server gracefully...");
  if (server) {
    server.close(() => {
      logger.info("HTTP server closed.");
    });
  }
  await mongoose.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
