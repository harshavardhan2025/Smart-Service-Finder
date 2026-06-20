import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  initiateCall,
  checkIncomingCall,
  answerCall,
  addIceCandidate,
  getCallSession,
  endCall,
  declineCall
} from "../controllers/callController.js";

const router = express.Router();

// All routes require auth
router.post("/initiate", protect, initiateCall);
router.get("/incoming", protect, checkIncomingCall);
router.post("/answer/:sessionId", protect, answerCall);
router.post("/ice/:sessionId", protect, addIceCandidate);
router.get("/session/:sessionId", protect, getCallSession);
router.post("/end/:sessionId", protect, endCall);
router.post("/decline/:sessionId", protect, declineCall);

export default router;
