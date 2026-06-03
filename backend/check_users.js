import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
    const ids = ["6a1d23a7cb9500a92f408062", "6a1d20fd2c68208bd09e194f"];
    for (const id of ids) {
      const user = await User.findById(id);
      console.log(`User ID: ${id}, Found: ${user ? "YES" : "NO"}, Name: ${user ? user.name : "N/A"}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
