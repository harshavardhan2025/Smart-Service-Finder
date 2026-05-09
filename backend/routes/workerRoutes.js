import express from "express";
import { getWorkers }
from "../controllers/workerController.js";

const router = express.Router();

router.get("/", getWorkers);

export default router;
