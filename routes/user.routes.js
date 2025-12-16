import express from "express";
import { loginUser, registerUser, verifyUser } from "../controllers/user.controller.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify/:token", verifyUser);
router.post("/login", loginUser )

export default router;
