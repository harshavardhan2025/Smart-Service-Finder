import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Worker from './models/Worker.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const workers = await Worker.find();
    console.log("Total Workers:", workers.length);
    
    const summary = {};
    workers.forEach(w => {
      const city = w.city || "Unknown";
      if (!summary[city]) {
        summary[city] = { total: 0, hasCoords: 0, noCoords: 0 };
      }
      summary[city].total++;
      if (w.lat !== undefined && w.lon !== undefined && w.lat !== null && w.lon !== null) {
        summary[city].hasCoords++;
      } else {
        summary[city].noCoords++;
      }
    });
    
    console.table(summary);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
