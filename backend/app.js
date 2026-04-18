import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./src/modules/auth/auth.routes.js";
import gameRoutes from "./src/routes/game.routes.js";
import { errorHandler } from "./src/middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);

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

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
