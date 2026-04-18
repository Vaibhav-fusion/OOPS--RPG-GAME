import { registerUser, authenticateUser } from "./auth.service.js";

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required." });
    }

    if (
      typeof username !== "string" ||
      username.length < 3 ||
      username.length > 20
    ) {
      return res
        .status(400)
        .json({ message: "Username must be between 3 and 20 characters." });
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ message: "A valid email address is required." });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }

    const user = await registerUser({ username, email, password });

    return res.status(201).json({
      message: "User registered successfully.",
      userId: user._id,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Unable to register user. Please try again later." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const { token } = await authenticateUser({ email, password });

    return res.status(200).json({ accessToken: token });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Unable to login. Please try again later." });
  }
};
