import mongoose from "mongoose";
import dotenv from "dotenv";
import Worker from "./models/Worker.js";

dotenv.config();

const runVerify = async () => {
  try {
    console.log("🔄 Connecting to MongoDB to verify and compute performance pricing system-wide...");
    await mongoose.connect(process.env.MONGO_URI);
    
    const allWorkers = await Worker.find({});
    console.log(`📊 Total Workers Found: ${allWorkers.length}`);
    
    let updateCount = 0;
    for (let worker of allWorkers) {
       // Calculate a smart dynamic price based on performance if it's missing or too low!
       let newPrice = worker.price;
       
       if (!newPrice || newPrice === 399) {
          // Let's inject smart varying prices based on rating to simulate dynamic pricing!
          if (worker.rating >= 4.8) newPrice = 850;
          else if (worker.rating >= 4.5) newPrice = 650;
          else if (worker.rating >= 4.0) newPrice = 450;
          else newPrice = 350;
          
          // Keep certain high-cost services stable
          if (worker.service.includes("Painting") || worker.service.includes("Movers") || worker.service.includes("Photography")) {
             newPrice = worker.price || 2500;
          }
          
          worker.price = newPrice;
          await worker.save();
          updateCount++;
          console.log(`✅ Optimized performance price for ${worker.name} to ₹${newPrice}`);
       }
    }
    
    console.log(`\n🏆 ALL DONE! Modified and confirmed pricing for ${updateCount} records!`);
    process.exit(0);
  } catch(err) {
    console.error("FAILED:", err);
    process.exit(1);
  }
};

runVerify();
