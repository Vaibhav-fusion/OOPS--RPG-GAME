import rateLimit from "express-rate-limit";
import logger from "./logger.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  handler: (req, res) => {
    logger.warn("Auth rate limit exceeded for %s", req.ip);
    res.status(429).json({
      message: "Too many authentication attempts. Try again later.",
    });
  },
});

export const revealLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(
      "Reveal rate limit exceeded for user %s",
      req.user?.userId || req.ip,
    );
    res.status(429).json({
      message: "Too many reveal requests. Slow down and try again.",
    });
  },
});
