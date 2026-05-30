import express from "express";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import Worker from "../models/Worker.js";

const router = express.Router();

// 🤖 DYNAMIC AI COST ESTIMATOR
router.get("/estimate-price", async (req, res) => {
  try {
    const { service, complexity, urgency, hours, details } = req.query;

    if (!service) {
      return res.status(400).json({ error: "Service category is required" });
    }

    const baseHours = Number(hours) || 1;
    
    // Find typical base price for this service category in DB or fallback
    let baselinePrice = 349;
    const dbService = await Worker.findOne({ service: new RegExp(`^${service}$`, "i") });
    if (dbService && dbService.price) {
      baselinePrice = dbService.price;
    }

    // Complexity multiplier
    let complexityMultiplier = 1.0;
    if (complexity === "Medium") complexityMultiplier = 1.3;
    if (complexity === "High") complexityMultiplier = 1.6;

    // Urgency surcharge
    const rushSurcharge = urgency === "Rush" ? 150 : 0;

    // Natural Language Text Parsing Scope Adjustment
    let scopeAdjustment = 0;
    const lowercaseDetails = (details || "").toLowerCase();
    
    if (lowercaseDetails.includes("heavy") || lowercaseDetails.includes("large") || lowercaseDetails.includes("premium")) {
      scopeAdjustment += 200;
    }
    if (lowercaseDetails.includes("install") || lowercaseDetails.includes("replace")) {
      scopeAdjustment += 150;
    }
    if (lowercaseDetails.includes("leak") || lowercaseDetails.includes("urgent") || lowercaseDetails.includes("clog")) {
      scopeAdjustment += 100;
    }

    const basePrice = Math.round(baselinePrice * baseHours);
    const complexityPremium = Math.round(basePrice * (complexityMultiplier - 1));
    const totalEstimate = Math.round(basePrice + complexityPremium + scopeAdjustment + rushSurcharge);

    res.status(200).json({
      success: true,
      service,
      breakdown: {
        basePrice,
        complexityPremium,
        scopeAdjustment,
        rushSurcharge,
        totalEstimate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🧠 AI RECOMMENDATION SYSTEM (Collaborative Filtering & Affinity Association)
router.get("/recommendations", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    // Fetch user bookings
    const userBookings = await Booking.find({ customer_id: user_id });

    // Fallback default recommendations if user has zero history
    const allServices = ["Electrical", "Plumbing", "House Cleaning", "AC Repair", "Carpentry", "Doctors & Medical", "Painting", "Events"];
    const fallbackRecs = ["House Cleaning", "Electrical", "AC Repair"];

    if (!userBookings || userBookings.length === 0) {
      return res.status(200).json({
        success: true,
        recommendations: fallbackRecs,
        basis: "Popular trending services in your city"
      });
    }

    // Count user's service affinity
    const serviceCounts = {};
    userBookings.forEach(b => {
      const s = b.service;
      serviceCounts[s] = (serviceCounts[s] || 0) + 1;
    });

    // Find the most frequently booked service
    let favoriteService = "";
    let maxCount = 0;
    Object.entries(serviceCounts).forEach(([s, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteService = s;
      }
    });

    // Set up ruleset for cross-selling recommendation mapping
    const rules = {
      "Carpentry": ["Painting", "House Cleaning"],
      "Plumbing": ["House Cleaning", "Electrical"],
      "Electrical": ["AC Repair", "Washing Machine"],
      "AC Repair": ["Electrical", "House Cleaning"],
      "House Cleaning": ["Plumbing", "Carpentry"],
      "Doctors & Medical": ["Care takers (baby)", "House Cleaning"],
      "Painting": ["Carpentry", "House Cleaning"]
    };

    let recs = rules[favoriteService] || ["House Cleaning", "Electrical"];
    
    // Filter out services they are currently booking in the active request if possible, or just return rules
    res.status(200).json({
      success: true,
      recommendations: recs,
      basis: `Based on your frequent booking of ${favoriteService} services`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
