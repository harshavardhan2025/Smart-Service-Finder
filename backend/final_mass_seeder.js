import mongoose from "mongoose";
import dotenv from "dotenv";
import Worker from "./models/Worker.js";
import User from "./models/User.js";
import { geocodeCity } from "./utils/geoUtils.js";

dotenv.config();

const definitions = [
  // AC Repair & Electronics
  { name: "Harsha Cooling Solutions", email: "ac1@local33.com", service: "AC Repair", price: 850 },
  { name: "Ravi Appliances", email: "ac2@local33.com", service: "AC Repair", price: 750 },
  { name: "Smart Geyser Service", email: "geyser@local33.com", service: "Geyser", price: 450 },
  { name: "Quick Washing Machine Repair", email: "washing@local33.com", service: "Washing Machine", price: 600 },
  { name: "Krishna Water Purifiers", email: "purifier@local33.com", service: "Water Purifier", price: 500 },
  
  // Cleaning sub-types
  { name: "Sparkle Floor Cleaners", email: "floor@local33.com", service: "Floor cleaning", price: 800 },
  { name: "Homely Maid Servants", email: "utensil@local33.com", service: "Utensils Cleaning", price: 300 },
  
  // Auto Wash & Mech sub-types
  { name: "Turbo Car Wash Kakinada", email: "carwash@local33.com", service: "Car Wash", price: 400 },
  { name: "Speedy Bike Cleaners", email: "bikewash@local33.com", service: "Bike Wash", price: 150 },
  { name: "Apex Car Mechanics", email: "apexcar@local33.com", service: "Four-Wheeler (Cars)", price: 1200 },
  
  // Painting & Decor sub-types
  { name: "Royal Wall Putty", email: "putty@local33.com", service: "Wall Putty Coating", price: 2000 },
  { name: "Modern Wallpapers Hub", email: "wallpapers@local33.com", service: "Wallpaper Installation", price: 3500 },
  { name: "Fine Texture Finishers", email: "texture@local33.com", service: "Texture & Designer Finishers", price: 4500 },
  
  // Beauty / Spa sub-types
  { name: "Glow Beauty Salon", email: "facial@local33.com", service: "Facials (Women)", price: 1200 },
  { name: "Vibe Hairstyling Lounge", email: "hairstyl@local33.com", service: "Hairstyling (Women)", price: 800 },
  { name: "Elegant Threading Experts", email: "threading@local33.com", service: "Threading (Women)", price: 150 },
  { name: "Classic Men Grooming", email: "grooming@local33.com", service: "Grooming (Men)", price: 400 },
  { name: "Serene Spa Sanctuary", email: "menspa@local33.com", service: "Spa (Men)", price: 1800 },
  
  // Events sub-types
  { name: "Sri Purohit Services", email: "purohit@local33.com", service: "Purohit", price: 1500 },
  { name: "Grand Decorators & Balloons", email: "decor@local33.com", service: "Decor", price: 5000 },
  { name: "Radha Mehandi Designs", email: "mehandi@local33.com", service: "Mehandi", price: 2000 },
  { name: "Bridal Bliss Makeup", email: "makeup@local33.com", service: "Makeup", price: 6000 },

  // Core Basics saturation
  { name: "Raju Emergency Plumber", email: "plumber9@local33.com", service: "Plumbing", price: 299 },
  { name: "Sai Teja Carpentry", email: "carpentry9@local33.com", service: "Carpentry", price: 600 },
  { name: "Ganesh Electrical Fixes", email: "electric9@local33.com", service: "Electrical", price: 400 },
  
  // Special niches
  { name: "Sweet Angels Caretakers", email: "babycare@local33.com", service: "Care takers (baby)", price: 10000 },
];

const cities = ["Kakinada", "Rajahmundry"];

const runSeeder = async () => {
  try {
     console.log("🚀 Initiating Mass Deep-Level Dataset Saturation...");
     await mongoose.connect(process.env.MONGO_URI);
     
     let createdCount = 0;
     for (let i = 0; i < definitions.length; i++) {
        const def = definitions[i];
        const existing = await Worker.findOne({ email: def.email });
        if (existing) continue;

        // Alternate distribute across cities evenly flawlessly
        const assignedCity = cities[i % 2];
        
        // Generate highly-rated authentic random performance metrics flawlessly
        const genRating = (4.0 + Math.random() * 1.0).toFixed(1);
        const genReviews = Math.floor(Math.random() * 80) + 10;
        const exp = (Math.floor(Math.random() * 8) + 2) + "+ Years";

        const locationStr = assignedCity === "Kakinada" ? "Bhanugudi Junction" : "Danavaipeta";
        const coords = await geocodeCity(locationStr);

        // Step 1: Commit to main Worker Collection
        const finalWorker = await Worker.create({
           name: def.name,
           email: def.email,
           service: def.service,
           city: assignedCity,
           location: locationStr,
           lat: coords ? coords.lat : null,
           lon: coords ? coords.lon : null,
           rating: Number(genRating),
           reviews: genReviews,
           price: def.price,
           experience: exp,
           status: "Active"
        });

        // Step 2: Simultaneously guarantee Auth capability instantly!
        await User.create({
           name: def.name,
           email: def.email,
           password: "password123", // Def standard password
           role: "worker",
           city: assignedCity
        });
        
        createdCount++;
        console.log(`✅ Inserted ${def.service} Expert: ${def.name} in ${assignedCity}`);
     }

     console.log(`\n🏆 MASS SATURATION COMPLETE! Deployed ${createdCount} active sub-service experts flawlessly!`);
     process.exit(0);
  } catch (err) {
     console.error("Mass Seed FAILED:", err);
     process.exit(1);
  }
};

runSeeder();
