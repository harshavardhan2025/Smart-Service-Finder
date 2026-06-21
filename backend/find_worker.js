import mongoose from "mongoose";
import dotenv from "dotenv";
import Worker from "./models/Worker.js";

dotenv.config();

async function find() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const worker = await Worker.findOne({ name: /Sunita/i, service: /Plumbing/i });
    if (worker) {
      console.log("FOUND WORKER:", JSON.stringify(worker, null, 2));
    } else {
      const allSunitas = await Worker.find({ name: /Sunita/i });
      console.log("All workers with name Sunita:", JSON.stringify(allSunitas, null, 2));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
find();
