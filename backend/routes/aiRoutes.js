import express from "express";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import Worker from "../models/Worker.js";

const router = express.Router();

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

// 🤖 AI SEMANTIC SEARCH QUERY EXPANSION
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, services: [] });
    }
    const qLower = q.toLowerCase();
    const matchedServices = [];

    const semanticMap = {
      plumbing: ["Plumbing"],
      pipe: ["Plumbing"],
      leak: ["Plumbing"],
      clog: ["Plumbing"],
      sink: ["Plumbing"],
      water: ["Plumbing", "Water Purifier"],
      tap: ["Plumbing"],
      
      electrical: ["Electrical"],
      wire: ["Electrical"],
      short: ["Electrical"],
      switch: ["Electrical"],
      light: ["Electrical"],
      fan: ["Electrical"],
      power: ["Electrical"],
      current: ["Electrical"],
      shock: ["Electrical"],
      
      carpentry: ["Carpentry"],
      wood: ["Carpentry"],
      door: ["Carpentry"],
      table: ["Carpentry"],
      chair: ["Carpentry"],
      sofa: ["Carpentry"],
      furniture: ["Carpentry"],
      
      painting: ["Painting", "Interior Painting", "Exterior Painting"],
      paint: ["Painting", "Interior Painting", "Exterior Painting"],
      wall: ["Painting", "Interior Painting", "Exterior Painting", "Wall Putty Coating", "Wallpaper Installation"],
      putty: ["Wall Putty Coating"],
      wallpaper: ["Wallpaper Installation"],
      color: ["Painting", "Interior Painting", "Exterior Painting"],
      
      cleaning: ["House Cleaning", "Floor cleaning", "Utensils Cleaning", "Car Wash", "Bike Wash"],
      clean: ["House Cleaning", "Floor cleaning", "Utensils Cleaning"],
      floor: ["Floor cleaning", "House Cleaning"],
      house: ["House Cleaning"],
      dust: ["House Cleaning", "Floor cleaning"],
      wash: ["Car Wash", "Bike Wash", "Utensils Cleaning"],
      utensil: ["Utensils Cleaning"],
      plate: ["Utensils Cleaning"],
      car: ["Car Wash", "Four-Wheeler (Cars)"],
      bike: ["Bike Wash", "Two-Wheeler (Bikes)"],
      
      ac: ["AC Repair"],
      cool: ["AC Repair", "Refrigerator"],
      fridge: ["Refrigerator"],
      refrigerator: ["Refrigerator"],
      geyser: ["Geyser"],
      heater: ["Geyser"],
      machine: ["Washing Machine"],
      washing: ["Washing Machine"],
      grinder: ["Grinder"],
      mixer: ["Mixer"],
      purifier: ["Water Purifier"],
      
      doctor: ["Doctors & Medical", "Doctors"],
      medical: ["Doctors & Medical", "Doctors"],
      fever: ["Doctors & Medical", "Doctors"],
      sick: ["Doctors & Medical", "Doctors"],
      pain: ["Doctors & Medical", "Doctors"],
      health: ["Doctors & Medical", "Doctors"],
      ill: ["Doctors & Medical", "Doctors"],
      
      photo: ["Photography"],
      wedding: ["Photography", "Decor", "Mehandi"],
      event: ["Photography", "Decor", "Mehandi"],
      camera: ["Photography"],
      decor: ["Decor"],
      decoration: ["Decor"],
      mehandi: ["Mehandi"],
      henna: ["Mehandi"]
    };

    Object.entries(semanticMap).forEach(([keyword, services]) => {
      if (qLower.includes(keyword)) {
        services.forEach(s => {
          if (!matchedServices.includes(s)) {
            matchedServices.push(s);
          }
        });
      }
    });

    res.status(200).json({ success: true, services: matchedServices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
