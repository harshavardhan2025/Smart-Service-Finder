import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Worker from "./models/Worker.js";
import Service from "./models/Service.js";
import Booking from "./models/Booking.js";
import Transaction from "./models/Transaction.js";
import Review from "./models/Review.js";
import Complaint from "./models/Complaint.js";
import Notification from "./models/Notification.js";
import Offer from "./models/Offer.js";
import Plan from "./models/Plan.js";

dotenv.config();

const clearAllButServices = async () => {
  try {
    await connectDB();
    console.log("🧹 Purging all relational seeded dummy data...");
    
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});
    await Transaction.deleteMany({});
    await Review.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});
    await Offer.deleteMany({});
    await Plan.deleteMany({});
    await Service.deleteMany({});
    
    console.log("✅ Purge complete. Seeding core service categories catalog...");
    
    // Seed standard core categories catalog
    await Service.insertMany([
      { name: "Plumbing", icon: "🔧" },
      { name: "Electrical", icon: "⚡" },
      { name: "Carpentry", icon: "🪚" },
      { name: "Haircut (Men)", icon: "💇‍♂️" },
      { name: "Two-Wheeler (Bikes)", icon: "🏍️" },
      { name: "Car Wash", icon: "🧼" },
      { name: "House Cleaning", icon: "🏠" },
      { name: "Photography", icon: "📸" },
      { name: "Doctors & Medical", icon: "🩺" },
      { name: "Interior Painting", icon: "🏠" }
    ]);
    
    // Create one clean initial Admin account
    await User.create({
      name: "Admin System",
      email: "amdin@workzy.com",
      password: "password123",
      role: "admin",
      city: "Kakinada"
    });
    
    console.log("\n🚀 DB PURGE COMPLETE! Active workers and users are now 100% REAL database data only!");
    process.exit(0);
  } catch (err) {
    console.error("Purge failed:", err);
    process.exit(1);
  }
};

clearAllButServices();
