import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
    const admins = await User.find({ role: "admin" });
    console.log(`Admins found: ${admins.length}`);
    for (const a of admins) {
      console.log(`Name: ${a.name}, Email: ${a.email}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
