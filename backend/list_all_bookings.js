import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "./models/Booking.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
    const bookings = await Booking.find({});
    console.log(`Total Bookings in Database: ${bookings.length}`);
    const statusCounts = {};
    for (const b of bookings) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      console.log(`- Booking ID: ${b._id}, Service: ${b.service}, Status: ${b.status}, Customer Name: ${b.customer_name}, Customer ID: ${b.customer_id}`);
    }
    console.log("Status counts:", statusCounts);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
