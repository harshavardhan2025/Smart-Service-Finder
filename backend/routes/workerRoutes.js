import express from "express";
import { getWorkers, getNearbyWorkers, updateWorker, deleteWorker, createWorker, geocodeLocation, sendMoneyToWorker } from "../controllers/workerController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/geocode", geocodeLocation);   // Proxy geosearch to bypass adblockers
router.get("/nearby", getNearbyWorkers);   // Radius-based geo search
router.get("/", getWorkers);               // Public access to discover talent!
router.post("/", createWorker);            // Register new worker
router.patch("/:id", protect, updateWorker);
router.delete("/:id", protect, adminOnly, deleteWorker);
router.post("/:id/send-money", protect, adminOnly, sendMoneyToWorker);

export default router;
