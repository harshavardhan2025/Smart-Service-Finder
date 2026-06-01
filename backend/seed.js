import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Worker from "./models/Worker.js";
import Service from "./models/Service.js";
import Offer from "./models/Offer.js";
import Plan from "./models/Plan.js";
import Complaint from "./models/Complaint.js";
import { geocodeCity } from "./utils/geoUtils.js";

dotenv.config();

const seedDynamicEcosystem = async () => {
  try {
    await connectDB();

    // Clear collections to ensure deterministic re-population
    await User.deleteMany();
    await Worker.deleteMany();
    await Service.deleteMany();
    await Offer.deleteMany();
    await Plan.deleteMany();
    await Complaint.deleteMany();

    console.log("🧹 DB Wiped. Planting fresh hyper-data seeds...");

    // 1. Seed Service Categories Catalog including all specific Sub-Services used in filters
    await Service.insertMany([
      { name: "Plumbing", icon: "🔧" },
      { name: "Electrical", icon: "⚡" },
      { name: "Carpentry", icon: "🪚" },
      { name: "Haircut (Men)", icon: "💇‍♂️" },
      { name: "Beard Trimming (Men)", icon: "🪒" },
      { name: "Grooming (Men)", icon: "🤵" },
      { name: "Spa (Men)", icon: "💆‍♂️" },
      { name: "Hairstyling (Women)", icon: "💇‍♀️" },
      { name: "Threading (Women)", icon: "🧵" },
      { name: "Facials (Women)", icon: "🧖‍♀️" },
      { name: "Nail Art (Women)", icon: "💅" },
      { name: "Floor cleaning", icon: "🧹" },
      { name: "Utensils Cleaning", icon: "🍽️" },
      { name: "House Cleaning", icon: "🏠" },
      { name: "Wall Putty Coating", icon: "🧱" },
      { name: "Interior Painting", icon: "🏠" },
      { name: "Exterior Painting", icon: "🏢" },
      { name: "Wallpaper Installation", icon: "🖼️" },
      { name: "Two-Wheeler (Bikes)", icon: "🏍️" },
      { name: "Four-Wheeler (Cars)", icon: "🚗" },
      { name: "Bike Wash", icon: "🏍️" },
      { name: "Car Wash", icon: "🧼" },
      { name: "AC Repair", icon: "❄️" },
      { name: "Washing Machine", icon: "🧺" },
      { name: "Geyser", icon: "🔥" },
      { name: "Photography", icon: "📸" },
      { name: "Decor", icon: "🎈" },
      { name: "Mehandi", icon: "🌿" },
      { name: "Makeup", icon: "💄" },
      { name: "Doctors & Medical", icon: "🩺" }
    ]);
    console.log("✅ Comprehensive Sub-Service categories created.");

    // 2. Seed Standard Customer and Admin Profiles
    await User.create([
      { name: "Admin System", email: "amdin@workzy.com", password: "password123", role: "admin" },
      { name: "Test Tester", email: "test@test.com", password: "password123", role: "user" },
      { name: "Ravi Kumar", email: "ravi@example.com", password: "password123", role: "user" }
    ]);
    console.log("✅ Core profiles mapped.");

    // 3. EXPLICIT WORKER BINDING TO EXACT SUB-SERVICE NAMES & LOCATIONS
    const initialWorkers = [
      // HYPER FOCUS: KAKINADA MARKET
      { name: "Raju Plumber", service: "Plumbing", city: "Kakinada", rating: 4.7, price: 299, experience: "10 Yrs" },
      { name: "Satya Electricals", service: "Electrical", city: "Kakinada", rating: 4.8, price: 399, experience: "6 Yrs" },
      { name: "Kumar Carpentry", service: "Carpentry", city: "Kakinada", rating: 4.5, price: 499, experience: "12 Yrs" },
      { name: "Vamsi AC Master", service: "AC Repair", city: "Kakinada", rating: 4.9, price: 599, experience: "4 Yrs" },
      { name: "Durga Bike Fix", service: "Two-Wheeler (Bikes)", city: "Kakinada", rating: 4.6, price: 350, experience: "8 Yrs" },
      { name: "Sridevi Beauty Parlor", service: "Facials (Women)", city: "Kakinada", rating: 4.8, price: 1200, experience: "5 Yrs" },
      { name: "Rao Photography", service: "Photography", city: "Kakinada", rating: 4.7, price: 8000, experience: "10 Yrs" },

      // HYPER FOCUS: MUMBAI MARKET
      { name: "Vikram Saloon", service: "Haircut (Men)", city: "Mumbai", rating: 4.9, price: 250, experience: "3 Yrs" },
      { name: "Urban Clean Pro", service: "House Cleaning", city: "Mumbai", rating: 4.8, price: 850, experience: "2 Yrs" },
      { name: "Reliance Medical", service: "Doctors & Medical", city: "Mumbai", rating: 4.9, price: 1500, experience: "15 Yrs" },
      { name: "Mumbai Movers", service: "Packers & Movers", city: "Mumbai", rating: 4.6, price: 15000, experience: "8 Yrs" },

      // HYPER FOCUS: BANGALORE MARKET
      { name: "Green Spa", service: "Spa (Men)", city: "Bangalore", rating: 4.7, price: 1500, experience: "5 Yrs" },
      { name: "Fresh Shine Wash", service: "Car Wash", city: "Bangalore", rating: 4.8, price: 499, experience: "4 Yrs" },
      { name: "Gowda Wallpapers", service: "Wallpaper Installation", city: "Bangalore", rating: 4.6, price: 3500, experience: "6 Yrs" },
      { name: "Dr. Ananya", service: "Doctors & Medical", city: "Bangalore", rating: 5.0, price: 2000, experience: "12 Yrs" },

      // HYPER FOCUS: HYDERABAD MARKET
      { name: "Charminar Mehandi", service: "Mehandi", city: "Hyderabad", rating: 4.9, price: 1500, experience: "7 Yrs" },
      { name: "Nizam Decor", service: "Decor", city: "Hyderabad", rating: 4.8, price: 10000, experience: "9 Yrs" },
      { name: "Cyber City Mechanics", service: "Four-Wheeler (Cars)", city: "Hyderabad", rating: 4.7, price: 900, experience: "10 Yrs" },
      { name: "Reddy Electricals", service: "Electrical", city: "Hyderabad", rating: 4.8, price: 450, experience: "11 Yrs" },

      // ADDITIONAL DIVERSE SERVICES (Tier 1 Cities)
      { name: "Paint Masters", service: "Interior Painting", city: "Chennai", rating: 4.8, price: 7000, experience: "14 Yrs" },
      { name: "Delhi Nails", service: "Nail Art (Women)", city: "Delhi", rating: 4.7, price: 800, experience: "3 Yrs" },
      { name: "Tirupati Purohit", service: "Purohit", city: "Tirupati", rating: 5.0, price: 2100, experience: "25 Yrs" },
      { name: "Quick Geyser Fix", service: "Geyser", city: "Chennai", rating: 4.5, price: 499, experience: "5 Yrs" }
    ];

    // Distribute unique generated emails automatically for batch population to avoid uniqueness constraint issues
    const fullPopulation = await Promise.all(
      initialWorkers.map(async (w, idx) => {
        let lat = null;
        let lon = null;
        try {
          const coords = await geocodeCity(w.city);
          if (coords) {
            lat = coords.lat;
            lon = coords.lon;
          }
        } catch (err) {
          console.error(`Geocoding failed for seeded worker ${w.name}:`, err.message);
        }
        return {
          ...w,
          location: w.city, // Explicitly mapping location keyword so logic never breaks
          lat,
          lon,
          email: w.email || `provider_${idx}_${Date.now()}@workzy.com`
        };
      })
    );

    // Add worker user accounts automatically for ALL generated accounts
    for(let w of fullPopulation) {
      await User.create({
        name: w.name,
        email: w.email,
        password: "workerpassword",
        role: "worker",
        city: w.city
      });
    }

    await Worker.insertMany(fullPopulation);
    console.log("✅ Advanced Geo-Distributed Workforce Seeding Finished.");

    // 4. Seed Dynamic Promotional Offers
    await Offer.insertMany([
      { title: "Festive 50% OFF", discount: "50% OFF", code: "FESTIVE50", expiry: "2026-12-31" },
      { title: "Welcome Bonus ₹100", discount: "₹100 Cashback", code: "WELCOME100", expiry: "2026-12-31" },
      { title: "Weekend Mega Sale", discount: "30% Instant Discount", code: "WEEKEND30", expiry: "2026-06-30" }
    ]);
    console.log("✅ Marketing Offers created.");

    // 5. Seed Service Subscription Plans
    await Plan.insertMany([
      { title: "Basic", price: "₹99/mo", features: ["3 Free Services", "Standard Support"], color: "#ffffff" },
      { title: "Premium Yearly", price: "₹999/yr", features: ["Unlimited Visits", "0% Commision", "Priority Pass"], color: "#f8fafc" }
    ]);
    console.log("✅ Tiered Plans created.");

    // 6. Seed Placeholder Global Support Complaint
    await Complaint.create({
      reported_by: "SYSTEM_INIT",
      issue_type: "Service Quality Diagnostic",
      status: "Under Review",
      description: "Automated generation verifying the operational integrity of help desks."
    });
    console.log("✅ Support Ticketing sample created.");
    console.log("🎉 ECOSYSTEM IS FULLY SATURATED!");
    process.exit();
  } catch (error) {
    console.error(`❌ Ecosystem Seed Failed: ${error.message}`);
    process.exit(1);
  }
};

seedDynamicEcosystem();
