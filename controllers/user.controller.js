import { loginSchema, registerSchema } from "../config/zod.js";
import tryCatch from "../middleware/tryCatch.js";
import sanitize from "mongo-sanitize";
import { redisClient } from "../server.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getOtpHtml, getVerifyEmailHtml } from "../config/emailTemplate.js";
import {
  generateAccessToken,
  generateToken,
  verifyRefreshToken,
} from "../config/generateToken.js";

export const registerUser = tryCatch(async (req, res) => {
  const sanitizeBody = sanitize(req.body);
  const validation = registerSchema.safeParse(sanitizeBody);

  if (!validation.success) {
    const zodError = validation.error;

    let allError = [];
    let firstErrorMessage = "Validation failed"; // default fallback

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allError = zodError.issues.map((issue) => ({
        field: issue.path?.join(".") || "unknown",
        message: issue.message || "Validation Error",
        code: issue.code || "unknown_code",
      }));
    }

    // Pick first error message if exists
    firstErrorMessage = allError[0]?.message || firstErrorMessage;

    return res.status(400).json({
      message: firstErrorMessage,
      error: allError,
    });
  }

  const { name, email, password } = validation.data;

  // rate limit with ip
  const rateLimitKey = `register-rate-limit:${req.ip}:${email}`;

  // check rate limit if have in redis
  const checkRateLimit = await redisClient.get(rateLimitKey);
  if (checkRateLimit) {
    return res.status(429).json({
      message: "Too many requests, Try again later",
    });
  }

  // check user db
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "This email address is already registered" });
  }

  // pasword hashed
  const hashpwd = await bcrypt.hash(password, 10);

  const verifyToken = crypto.randomBytes(32).toString("hex");
  const verifyKey = `verify:${verifyToken}`;
  const dataStore = JSON.stringify({
    name,
    email,
    password: hashpwd,
  });
  // store the data to redis for 5 mnt
  await redisClient.set(verifyKey, dataStore, { EX: 300 });

  const subject = "verify your email for account creation";
  const html = getVerifyEmailHtml({ email, token: verifyToken });

  await sendMail({ email, subject, html });
  await redisClient.set(rateLimitKey, "true", { EX: 60 });

  res.status(200).json({
    message:
      "If your email is valid, a verification link has been sent. It will expire in 5 minutes.",
  });
});

export const verifyUser = tryCatch(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({
      message: "Verification token is required!",
    });
  }
  const verifyKey = `verify:${token}`;
  const userDataJson = await redisClient.get(verifyKey);
  if (!userDataJson) {
    return res.status(400).json({
      message: "Verification link is expired",
    });
  }
  await redisClient.del(verifyKey);
  const userData = JSON.parse(userDataJson);

  // check again user db
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "This email address is already registered" });
  }

  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  res.status(201).json({
    message: "Email verified successfully! Your acount hav been created",
    user: { _id: newUser._id, name: newUser.name, email: newUser.email },
  });
});

export const loginUser = tryCatch(async (req, res) => {
  const sanitizeBody = sanitize(req.body);
  const validation = loginSchema.safeParse(sanitizeBody);

  if (!validation.success) {
    const zodError = validation.error;

    let allError = [];
    let firstErrorMessage = "Validation failed"; // default fallback

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allError = zodError.issues.map((issue) => ({
        field: issue.path?.join(".") || "unknown",
        message: issue.message || "Validation Error",
        code: issue.code || "unknown_code",
      }));
    }

    // Pick first error message if exists
    firstErrorMessage = allError[0]?.message || firstErrorMessage;

    return res.status(400).json({
      message: firstErrorMessage,
      error: allError,
    });
  }

  const { email, password } = validation.data;

  // rate limit for login
  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;

  // check rate limit if have in redis
  const checkRateLimit = await redisClient.get(rateLimitKey);
  if (checkRateLimit) {
    return res.status(429).json({
      message: "Too many requests, Try again later",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      message: "Invalid credentials",
      errorCode: "INVALID_CREDENTIALS",
    });
  }
  const comparePwd = await bcrypt.compare(password, user.password);

  if (!comparePwd) {
    return res.status(400).json({
      message: "Invalid credentials",
      errorCode: "INVALID_CREDENTIALS",
    });
  }

  const otp = crypto.randomInt(100000, 999999);

  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, JSON.stringify(otp), { EX: 300 });

  const subject = "OTP for verification";
  const html = getOtpHtml({ email, otp });
  await sendMail({ email, subject, html });

  await redisClient.set(rateLimitKey, "true", {
    EX: 60,
  });
  res.json({
    message:
      "If your email is valid, a verification link has been sent. It will expire in 5 minutes.",
  });
});

export const verifyOtp = tryCatch(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      message: "Please Provide all details",
    });
  }
  const otpKey = `otp:${email}`;
  const storeOtpString = await redisClient.get(otpKey);
  if (!storeOtpString) {
    return res.status(400).json({
      message: "OTP is expired!",
    });
  }

  const storeOtp = JSON.parse(storeOtpString);

  if (String(storeOtp) !== String(otp)) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }
  await redisClient.del(otpKey);
  let user = await User.findOne({ email }).select("-password");

  const tokenData = await generateToken(user._id, res);
  res.status(200).json({
    message: `welcome ${user.email}`,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
  });
});

export const myProfile = tryCatch(async (req, res) => {
  const user = req.user;
  res.status(200).json(user);
});

export const refreshToken = tryCatch(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log("Cookies:", req.cookies);

  if (!refreshToken) {
    return res.status(401).json({
      message: "Invalid refresh token! ",
    });
  }
  const decode = await verifyRefreshToken(refreshToken);
  if (!decode) {
    return res.status(401).json({
      message: "Invalid refresh token!",
    });
  }
  generateAccessToken(decode.id, res);
  res.status(200).json({
    message: "Token refreshed",
  });
});

/**
 ******************* After review this code **********
 * email will be convert to lowercase email.toLowerCase()
 * Force emails to lowercase before storing or checking
 * Math.random() is not cryptographically secure. Use crypto.randomInt(100000, 999999) instead for OTPs
 * Use crypto.randomInt for OTPs.
 * Consider logging suspicious login attempts.
 *
 * OTP comparison: if(storeOtp !== otp) might fail if one is a string and the other is a number. Use String(storeOtp) !== String(otp) to be safe.
 *
 */
