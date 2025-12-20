import jwt from "jsonwebtoken";
import { redisClient } from "../server.js";
import User from "../models/user.model.js";
import { isSessionActive } from "../config/generateToken.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(403).json({
        message: "Please Login - no token!",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({
        message: err.message,
        code: "JWT_EXPIRED",
      });
    }

    console.log(decoded)

    const sessionActive = await isSessionActive(decoded.id, decoded.sessionId);

    if (!sessionActive) {
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      res.clearCookie("csrfToken");

      return res.status(401).json({
        message: "Session Expired. You have been logged in from another device",
      });
    }

    const cacheUser = await redisClient.get(`user:${decoded.id}`);

    if (cacheUser) {
      req.user = JSON.parse(cacheUser);

      req.sessionId = decoded.sessionId;

      return next();
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(400).json({
        message: "No user find with this id",
      });
    }

    await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));

    req.user = user;

    req.sessionId = decoded.sessionId;

    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const authorizeAdmin = async (req, res, next) => {
  const user = req.user;

  if (!user || user.role !== "admin") {
    return res.status(401).json({
      message: "Opps! You are not allowed for this activity.",
    });
  }

  next();
};
