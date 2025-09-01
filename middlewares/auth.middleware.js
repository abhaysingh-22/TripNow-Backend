import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import BlacklistToken from "../models/blacklistToken.model.js";
import Captain from "../models/captain.model.js";

const authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication token is required" });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token: token });

  if (isBlacklisted) {
    return res
      .status(401)
      .json({ error: "Token is blacklisted, please log in again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.user = user;

    return next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

const authCaptain = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication token is required" });
  }

  const isBlacklisted = await BlacklistToken.findOne({ token: token });

  if (isBlacklisted) {
    return res
      .status(401)
      .json({ error: "Token is blacklisted, please log in again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const captain = await Captain.findById(decoded._id);
    if (!captain) {
      return res.status(404).json({ error: "Captain not found" });
    }
    req.captain = captain;

    return next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export { authUser, authCaptain };
