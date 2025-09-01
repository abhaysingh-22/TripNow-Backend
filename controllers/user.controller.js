import User from "../models/user.model.js";
import { createUser } from "../services/user.service.js";
import { validationResult } from "express-validator";
import BlacklistToken from "../models/blacklistToken.model.js";

const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await User.hashPassword(password);
    if (!hashedPassword) {
      return res.status(500).json({ error: "Failed to hash password" });
    }

    const user = await createUser({
      firstName: fullName.firstName,
      lastName: fullName.lastName,
      email,
      password: hashedPassword,
    });

    const token = user.generateAuthToken();
    if (!token) {
      return res.status(500).json({ error: "Failed to generate auth token" });
    }

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error("Register user error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = user.generateAuthToken();
    if (!token) {
      return res.status(500).json({ error: "Failed to generate auth token" });
    }

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Login user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        fullName: {
          firstName: user.fullName.firstName,
          lastName: user.fullName.lastName,
        },
        email: user.email,
      },
      message: "User profile retrieved successfully",
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const logoutUser = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Authentication token is required" });
    }

    await BlacklistToken.create({ token });
    res.clearCookie("token");

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { registerUser, loginUser, getUserProfile, logoutUser };
