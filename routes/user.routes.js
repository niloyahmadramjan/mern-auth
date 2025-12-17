import express from "express";
import {
  loginUser,
  myProfile,
  refreshToken,
  registerUser,
  userLogOut,
  verifyOtp,
  verifyUser,
} from "../controllers/user.controller.js";
import { isAuth } from "../middleware/isAuth.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.get("/me", isAuth, myProfile);
router.post("/refresh-token", refreshToken);
router.post("/logout", isAuth, userLogOut);

export default router;
6;
