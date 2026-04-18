import User from "../../models/user.model.js";
import { hashPassword, comparePassword } from "../../utils/hash.util.js";
import { signToken } from "../../utils/jwt.util.js";

export const registerUser = async ({ username, email, password }) => {
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  }).lean();

  if (existingUser) {
    const error = new Error("Email or username is already in use.");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  return user;
};

export const authenticateUser = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  const token = signToken({ userId: user._id.toString() });

  return { token };
};
