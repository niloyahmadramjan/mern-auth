import express from "express";
import {
  loginUser,
  myProfile,
  refreshCSRF,
  refreshToken,
  registerUser,
  userLogOut,
  verifyOtp,
  verifyUser,
} from "../controllers/user.controller.js";
import { isAuth } from "../middleware/isAuth.js";
import { verifyCSRFToken } from "../config/csrfMiddleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.get("/me", isAuth, myProfile);
router.post("/refresh-token", refreshToken);
router.post("/logout", isAuth,verifyCSRFToken, userLogOut);
router.post("/refresh-csrf", isAuth, refreshCSRF);

export default router;
6;
