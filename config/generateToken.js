import jwt from "jsonwebtoken";
import { redisClient } from "../server.js";
import { generateCSRFToken, revokeCSRFTOKEN } from "./csrfMiddleware.js";

export const generateToken = async (id, res) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXP,
  });
  const refreshToken = jwt.sign({ id }, process.env.REFESH_SECRET, {
    expiresIn: process.env.REFESH_TOKEN_EXP,
  });

  const refreshTokenKey = `refresh_token:${id}`;
  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    // for 15 min
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });
  const csrfToken = await generateCSRFToken(id, res);

  return { accessToken, refreshToken, csrfToken };
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decode = jwt.verify(refreshToken, process.env.REFESH_SECRET);
    const storedToken = await redisClient.get(`refresh_token:${decode.id}`);
    if (storedToken === refreshToken) {
      return decode;
    }
    return null;
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export const generateAccessToken = async (id, res) => {
  const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXP,
  });
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    // for 1 min
    maxAge: 15 * 60 * 1000,
  });
};

export const revokeRefreshToken = async (userId) => {
  await redisClient.del(`refresh_token:${userId}`);
  await revokeCSRFTOKEN();
};
