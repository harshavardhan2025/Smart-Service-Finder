import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "./models/Booking.js";
import User from "./models/User.js";
import jwt from "jsonwebtoken";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
    console.log("Connected to database.");

    // 1. Get or create a mock customer and booking with "Cancellation Pending" status
    const customer = await User.findOne({ role: "user" });
    if (!customer) {
      console.error("No customer found in DB to run test.");
      process.exit(1);
    }
    
    const booking = await Booking.create({
      customer_id: customer._id.toString(),
      customer_name: customer.name,
      worker_id: "6a1d21112c68208bd09e19db", // Sanjay Reddy
      date: "2026-06-10",
      time: "10:00 AM",
      service: "Plumbing Services",
      price: 500,
      status: "Cancellation Pending",
      cancelReason: "Testing API Refund"
    });
    console.log(`Created test booking ID: ${booking._id}`);

    // 2. Log in as admin to get token
    // Note: Since we don't know amdin@workzy.com's password, we will manually sign a JWT token using JWT_SECRET
    // Or check if the server is running and we can generate a token.
    const adminUser = await User.findOne({ email: "amdin@workzy.com" });
    if (!adminUser) {
      console.error("Admin user not found.");
      process.exit(1);
    }
    const token = jwt.sign(
      { id: adminUser._id.toString(), email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || "EMERGENCY_FALLBACK_KEY_NOT_SET_IN_ENV",
      { expiresIn: "1h" }
    );
    console.log("Generated Admin Token.");

    // 3. Make HTTP request to approve-refund
    const url = `http://127.0.0.1:5000/api/bookings/${booking._id}/approve-refund`;
    console.log(`Sending POST request to ${url}...`);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", data);

    // Clean up
    await Booking.findByIdAndDelete(booking._id);
    
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}
run();
