import express from "express";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import Worker from "../models/Worker.js";
import { findBestServiceMatch } from "../controllers/chatController.js";

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
    const qLower = q.toLowerCase().trim();
    const matchedServices = [];

    const fuzzyMatch = findBestServiceMatch(qLower);
    if (fuzzyMatch) {
      matchedServices.push(fuzzyMatch);
    }

    const semanticMap = {
      // 🔧 Plumbing
      plumb: ["Plumbing"],
      pipe: ["Plumbing"],
      leak: ["Plumbing"],
      clog: ["Plumbing"],
      sink: ["Plumbing"],
      water: ["Plumbing", "Water Purifier"],
      tap: ["Plumbing"],
      drain: ["Plumbing"],
      basin: ["Plumbing"],
      toilet: ["Plumbing"],
      shower: ["Plumbing"],
      faucet: ["Plumbing"],
      
      // ⚡ Electrical
      electr: ["Electrical"],
      wire: ["Electrical"],
      short: ["Electrical"],
      switch: ["Electrical"],
      light: ["Electrical"],
      fan: ["Electrical"],
      power: ["Electrical"],
      current: ["Electrical"],
      shock: ["Electrical"],
      bulb: ["Electrical"],
      fuse: ["Electrical"],
      socket: ["Electrical"],
      meter: ["Electrical"],
      
      // 🪚 Carpentry
      carpen: ["Carpentry"],
      wood: ["Carpentry", "Wood Polishing"],
      door: ["Carpentry"],
      table: ["Carpentry"],
      chair: ["Carpentry"],
      sofa: ["Carpentry"],
      furniture: ["Carpentry"],
      wardrobe: ["Carpentry"],
      cabinet: ["Carpentry"],
      latch: ["Carpentry"],
      lock: ["Carpentry"],
      handle: ["Carpentry"],
      polish: ["Wood Polishing"],
      
      // 🎨 Painting & Finishers
      paint: ["Painting", "Interior Painting", "Exterior Painting", "Wood Polishing"],
      wall: ["Painting", "Interior Painting", "Exterior Painting", "Wall Putty Coating", "Wallpaper Installation"],
      putty: ["Wall Putty Coating"],
      wallpaper: ["Wallpaper Installation"],
      color: ["Painting", "Interior Painting", "Exterior Painting"],
      brush: ["Painting", "Interior Painting", "Exterior Painting"],
      roller: ["Painting", "Interior Painting", "Exterior Painting"],
      distemper: ["Painting", "Interior Painting", "Exterior Painting"],
      primer: ["Painting", "Interior Painting", "Exterior Painting"],
      stain: ["Painting", "Wood Polishing"],
      texture: ["Texture & Designer Finishers"],
      finish: ["Texture & Designer Finishers"],
      design: ["Texture & Designer Finishers"],
      
      // 🧹 Cleaning & Washing
      clean: ["House Cleaning", "Floor cleaning", "Utensils Cleaning", "Car Wash", "Bike Wash"],
      sweep: ["House Cleaning", "Floor cleaning"],
      mop: ["Floor cleaning", "House Cleaning"],
      dust: ["House Cleaning", "Floor cleaning"],
      floor: ["Floor cleaning", "House Cleaning"],
      house: ["House Cleaning"],
      room: ["House Cleaning"],
      home: ["House Cleaning"],
      vacuum: ["House Cleaning"],
      kitchen: ["House Cleaning", "Utensils Cleaning"],
      bathroom: ["House Cleaning"],
      dirty: ["House Cleaning", "Floor cleaning", "Utensils Cleaning"],
      dish: ["Utensils Cleaning"],
      plate: ["Utensils Cleaning"],
      utensil: ["Utensils Cleaning"],
      pot: ["Utensils Cleaning"],
      
      // 🚗 Automobile & Mechanical
      wash: ["Car Wash", "Bike Wash", "Utensils Cleaning", "Washing Machine"],
      car: ["Car Wash", "Four-Wheeler (Cars)"],
      bike: ["Bike Wash", "Two-Wheeler (Bikes)"],
      motorcycle: ["Bike Wash", "Two-Wheeler (Bikes)"],
      scooter: ["Bike Wash", "Two-Wheeler (Bikes)"],
      vehicle: ["Car Wash", "Bike Wash", "Four-Wheeler (Cars)", "Two-Wheeler (Bikes)"],
      automobile: ["Car Wash", "Bike Wash", "Four-Wheeler (Cars)", "Two-Wheeler (Bikes)"],
      mechanic: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)"],
      engine: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)"],
      brake: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)"],
      puncture: ["Two-Wheeler (Bikes)", "Four-Wheeler (Cars)"],
      heavy: ["Others (Heavy)"],
      truck: ["Others (Heavy)"],
      tractor: ["Others (Heavy)"],
      
      // ❄️ Appliance Repair
      ac: ["AC Repair"],
      conditioner: ["AC Repair"],
      cool: ["AC Repair", "Refrigerator"],
      hot: ["AC Repair", "Refrigerator"],
      fridge: ["Refrigerator"],
      refrigerator: ["Refrigerator"],
      freezer: ["Refrigerator"],
      geyser: ["Geyser"],
      heater: ["Geyser"],
      boiler: ["Geyser"],
      machine: ["Washing Machine"],
      washing: ["Washing Machine"],
      dryer: ["Washing Machine"],
      grinder: ["Grinder"],
      mixer: ["Mixer"],
      juicer: ["Mixer"],
      purifier: ["Water Purifier"],
      ro: ["Water Purifier"],
      filter: ["Water Purifier"],
      appliance: ["AC Repair", "Washing Machine", "Geyser", "Grinder", "Mixer", "Refrigerator", "Water Purifier"],
      
      // 🩺 Doctors & Medical
      doctor: ["Doctors & Medical", "Doctors"],
      medical: ["Doctors & Medical", "Doctors"],
      physician: ["Doctors & Medical", "Doctors"],
      nurse: ["Doctors & Medical", "Doctors"],
      clinic: ["Doctors & Medical", "Doctors"],
      hospital: ["Doctors & Medical", "Doctors"],
      medicine: ["Doctors & Medical", "Doctors"],
      fever: ["Doctors & Medical", "Doctors"],
      sick: ["Doctors & Medical", "Doctors"],
      pain: ["Doctors & Medical", "Doctors"],
      health: ["Doctors & Medical", "Doctors"],
      ill: ["Doctors & Medical", "Doctors"],
      cough: ["Doctors & Medical", "Doctors"],
      cold: ["Doctors & Medical", "Doctors"],
      flu: ["Doctors & Medical", "Doctors"],
      
      // 💄 Beauty & Wellness
      beauty: ["Beauty, Salon & Spa"],
      salon: ["Beauty, Salon & Spa"],
      spa: ["Beauty, Salon & Spa"],
      makeup: ["Beauty, Salon & Spa"],
      facial: ["Beauty, Salon & Spa"],
      haircut: ["Beauty, Salon & Spa"],
      massage: ["Beauty, Salon & Spa"],
      groom: ["Beauty, Salon & Spa"],
      bride: ["Beauty, Salon & Spa", "Mehandi", "Photography"],
      henna: ["Mehandi"],
      mehandi: ["Mehandi"],
      mehendi: ["Mehandi"],
      
      // 📸 Photography & Events
      photo: ["Photography"],
      video: ["Photography"],
      camera: ["Photography"],
      shoot: ["Photography"],
      wedding: ["Photography", "Decor", "Mehandi"],
      marriage: ["Photography", "Decor", "Mehandi"],
      party: ["Photography", "Decor", "Mehandi"],
      event: ["Photography", "Decor", "Mehandi"],
      decor: ["Decor"],
      decoration: ["Decor"],
      flower: ["Decor"],
      balloon: ["Decor"],
      stage: ["Decor"]
    };

    Object.entries(semanticMap).forEach(([keyword, services]) => {
      if (qLower.includes(keyword) || (qLower.length >= 2 && keyword.includes(qLower))) {
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
