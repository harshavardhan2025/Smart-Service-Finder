import express from "express";
import { getWorkers, getNearbyWorkers, updateWorker, deleteWorker } from "../controllers/workerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/nearby", getNearbyWorkers);   // Radius-based geo search
router.get("/", getWorkers);               // Public access to discover talent!
router.patch("/:id", protect, updateWorker);
router.delete("/:id", protect, deleteWorker);

export default router;
