import jwt, { decode } from "jsonwebtoken";
import { redisClient } from "../server.js";
import User from "../models/user.model.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(403).json({
        message: "Please Login - no token!",
      });
    }
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // if (!decoded) {
    //   return res.status(400).json({
    //     message: "Token expired!",
    //   });
    // }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: err.message, // "jwt expired"
        code: "JWT_EXPIRED",
      });
    }

    const cacheUser = await redisClient.get(`user:${decoded.id}`);

    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
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
    next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
