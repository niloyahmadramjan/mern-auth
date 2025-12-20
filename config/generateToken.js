import jwt from "jsonwebtoken";
import { redisClient } from "../server.js";
import { generateCSRFToken, revokeCSRFTOKEN } from "./csrfMiddleware.js";
import crypto from "crypto";

export const generateToken = async (id,req, res) => {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const accessToken = jwt.sign({ id, sessionId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXP,
  });
  const refreshToken = jwt.sign({ id, sessionId }, process.env.REFESH_SECRET, {
    expiresIn: process.env.REFESH_TOKEN_EXP,
  });

  const refreshTokenKey = `refresh_token:${id}`;
  const activeSessionKey = `active_session:${id}`;
  const sessionDataKey = `session:${sessionId}`;

  const existingSession = await redisClient.get(activeSessionKey);

  if (existingSession) {
    await redisClient.del(`session:${existingSession}`);
    await redisClient.del(`refresh_token:${id}`);
  }

  const sessionData = {
    userId: id,
    sessionId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);
  await redisClient.setEx(
    sessionDataKey,
    7 * 24 * 60 * 60,
    JSON.stringify(sessionData)
  );

  await redisClient.setEx(activeSessionKey, 7 * 24 * 60 * 60, sessionId);

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

  return { accessToken, refreshToken, csrfToken, sessionId };
};

export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decode = jwt.verify(refreshToken, process.env.REFESH_SECRET);
    const storedToken = await redisClient.get(`refresh_token:${decode.id}`);

    if (storedToken !== refreshToken) {
      return null;
    }
    const activeSessionId = await redisClient.get(
      `active_session:${decode.id}`
    );
    if (activeSessionId !== decode.sessionId) {
      return null;
    }

    const sessionData = await redisClient.get(`session:${decode.sessionId}`);

    if (!sessionData) {
      return null;
    }

    const parsedSessionData = JSON.parse(sessionData);
    parsedSessionData.lastActivity = new Date().toISOString();

    await redisClient.setEx(
      `session:${decode.sessionId}`,
      7 * 24 * 60 * 60,
      JSON.stringify(parsedSessionData)
    );
    return decode;
  } catch (error) {
    return null;
  }
};

export const generateAccessToken = async (id, sessionId, res) => {
  const accessToken = jwt.sign({ id, sessionId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXP,
  });
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    // for 15 min
    maxAge: 15 * 60 * 1000,
  });
};

export const revokeRefreshToken = async (userId) => {
  const activeSessionId = await redisClient.get(`active_session:${userId}`);
  await redisClient.del(`refresh_token:${userId}`);
  await redisClient.del(`active_session:${userId}`);
  await revokeCSRFTOKEN(userId);
  if (activeSessionId) {
    await redisClient.del(`session:${activeSessionId}`);
  }
};

export const isSessionActive = async (userId, sessionId) => {
  console.log("my sessionId: ", sessionId);
  console.log("my user id : ", userId);

  const activeSessionKey = `active_session:${userId}`;

  const existingSession = await redisClient.get(activeSessionKey);
  console.log(existingSession);

  return existingSession === sessionId;
};
