import User from "../models/user.model.js";
import logger from "../config/logger.js";

export const getUserProfile = async (userId) => {
  try {
    const user = await User.findById(userId).select("-password");
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    logger.error("Error getting user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const allowedUpdates = ["displayName", "avatarColor", "avatarUrl"];
    const filteredUpdates = {};

    // Only allow specific fields to be updated
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // If updating username, check if it's available
    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new Error("Username is already taken");
      }
      filteredUpdates.username = updates.username;
    }

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    logger.error("Error updating user profile:", error);
    throw error;
  }
};
