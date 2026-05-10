import express from "express";
import { getServices, createService, deleteService } from "../controllers/serviceController.js";
import Service from "../models/Service.js"; // Imported for test route

const router = express.Router();

// Validation TEST ROUTE requested in STEP 7
router.get("/add", async (req, res) => {
  try {
    const newService = new Service({
      name: "AC Repair",
      provider: "Ramesh",
      price: 499,
      location: "Tirupati",
      rating: 4.5
    });
    await newService.save();
    res.json({ message: "Test Service Added Successfully!", data: newService });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", getServices);
router.post("/", createService);
router.delete("/:id", deleteService);

export default router;
