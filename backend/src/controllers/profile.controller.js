import {
  getUserProfile,
  updateUserProfile,
} from "../services/profile.service.js";
import logger from "../config/logger.js";

export const getProfile = async (req, res) => {
  try {
    const user = await getUserProfile(req.user.id);
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get profile",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { displayName, avatarColor, avatarUrl, username } = req.body;

    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (avatarColor !== undefined) updates.avatarColor = avatarColor;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (username !== undefined) updates.username = username;

    const user = await updateUserProfile(req.user.id, updates);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    logger.error("Update profile error:", error);

    if (error.message === "Username is already taken") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};
