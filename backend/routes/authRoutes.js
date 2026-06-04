import express from "express";
import { registerUser, loginUser, googleAuth, googleMockAuth } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/google-mock", googleMockAuth);

export default router;
