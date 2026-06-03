import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Booking from "./models/Booking.js";
import User from "./models/User.js";
import Worker from "./models/Worker.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
    console.log("Connected to database.");

    // Retrieve users
    const customer = await User.findOne({ role: "user" });
    const adminUser = await User.findOne({ role: "admin" });
    let worker = await Worker.findOne({});
    if (!worker) {
      // Create a mock worker if none exists
      worker = await Worker.create({
        name: "Test Worker",
        email: "testworker@workzy.com",
        service: "Plumbing",
        city: "Kakinada",
        walletBalance: 0,
        status: "Active"
      });
    }

    if (!customer || !adminUser) {
      console.error("Required test users not found in DB.");
      process.exit(1);
    }

    // Sign admin token
    const token = jwt.sign(
      { id: adminUser._id.toString(), email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || "EMERGENCY_FALLBACK_KEY_NOT_SET_IN_ENV",
      { expiresIn: "1h" }
    );
    console.log("Generated Admin Token.");

    // Helper function to test a URL
    const testPost = async (urlSuffix, initialStatus, payload = {}) => {
      // Create temporary booking
      const booking = await Booking.create({
        customer_id: customer._id.toString(),
        customer_name: customer.name,
        worker_id: worker._id.toString(),
        date: "2026-06-10",
        time: "10:00 AM",
        service: "Plumbing Services",
        price: 300,
        status: initialStatus,
        cancelReason: "Testing Endpoints"
      });

      const url = `http://127.0.0.1:5000/api/bookings/${booking._id}/${urlSuffix}`;
      console.log(`Testing POST ${urlSuffix} for booking in status "${initialStatus}"...`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log(`- Status: ${response.status}`);
      console.log("- Response Body:", data);

      // Clean up booking
      await Booking.findByIdAndDelete(booking._id);
      return response.status === 200;
    };

    // Run tests
    const r1 = await testPost("approve-refund", "Cancellation Pending");
    const r2 = await testPost("decline-refund", "Cancellation Pending");
    const r3 = await testPost("release", "Completed");
    const r4 = await testPost("decline-escrow", "Completed");

    console.log(`Results: approve-refund=${r1}, decline-refund=${r2}, release=${r3}, decline-escrow=${r4}`);
    process.exit((r1 && r2 && r3 && r4) ? 0 : 1);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}
run();
