import express from "express";
import { getWorkers, updateWorker, deleteWorker } from "../controllers/workerController.js";

const router = express.Router();

router.get("/", getWorkers);
router.patch("/:id", updateWorker);
router.delete("/:id", deleteWorker);

export default router;
