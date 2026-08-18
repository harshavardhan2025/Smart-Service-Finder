import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
  const users = await User.find({ name: /harsha/i });
  for (const u of users) {
    console.log(`- Email: ${u.email}, Name: ${u.name}, ID: ${u._id}`);
  }
  process.exit(0);
}
run();
