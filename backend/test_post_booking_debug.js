import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Worker from "./models/Worker.js";
import User from "./models/User.js";
import Booking from "./models/Booking.js";

dotenv.config();

const test = async () => {
  try {
    await connectDB();
    
    const customer = await User.findOne({ role: "user" });
    const worker = await Worker.findOne({ status: "Active" });

    if (!customer || !worker) {
      console.log("No customer or worker found to run test.");
      process.exit(0);
    }

    console.log(`Using Customer: ${customer._id} (${customer.name})`);
    console.log(`Using Worker: ${worker._id} (${worker.name})`);

    try {
      const booking = await Booking.create({
        customer_id: customer._id.toString(),
        customer_name: customer.name,
        worker_id: worker._id.toString(),
        date: "2026-06-14",
        time: "9 AM",
        service: worker.service,
        price: 500,
        address: "Test Address",
        status: "Pending"
      });
      console.log("Successfully created booking via Mongoose directly:", booking._id);
      await Booking.findByIdAndDelete(booking._id);
    } catch (dbErr) {
      console.error("Mongoose write failed:", dbErr);
    }

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    process.exit(0);
  }
};

test();
