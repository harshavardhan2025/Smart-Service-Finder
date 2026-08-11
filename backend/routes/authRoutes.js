import express from "express";
import { registerUser, loginUser, googleAuth, googleMockAuth, joinAsWorker } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/google-mock", googleMockAuth);
router.post("/join-as-worker", joinAsWorker);

export default router;
