import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "./models/Booking.js";
import User from "./models/User.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
    console.log("Connected to database.");
    
    const pendingBookings = await Booking.find({ status: "Cancellation Pending" });
    console.log(`Found ${pendingBookings.length} bookings with status "Cancellation Pending":`);
    
    for (const b of pendingBookings) {
      const customer = await User.findById(b.customer_id);
      console.log(`- Booking ID: ${b._id}`);
      console.log(`  Customer ID: ${b.customer_id}`);
      console.log(`  Customer Name: ${b.customer_name}`);
      console.log(`  Customer Found in DB: ${customer ? "YES" : "NO"}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
