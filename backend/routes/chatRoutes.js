import express from "express";
import { proxyChat } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", proxyChat);

export default router;
