import { registerSchema } from "../config/zod.js";
import tryCatch from "../middleware/tryCatch.js";
import sanitize from "mongo-sanitize";
import { redisClient } from "../server.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

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
  const exitingUser = await User.find({ email });

  if (exitingUser) {
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
  await redisClient.set(verifyKey,dataStore,{EX: 300});

  const subject = "verify your email for account creation";
  const html = ``

  res.status(200).json({ name, email, password });
});
