import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const dropEntireDatabase = async () => {
  try {
    await connectDB();
    
    // Get database instance directly
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`🚨 FOUND ${collections.length} COLLECTIONS TO ABSOLUTELY DESTROY.`);
    
    for (let coll of collections) {
       // Drop the collection entirely instead of just wiping data
       await db.collection(coll.name).drop().catch(err => console.log(`⚠️ Handled error dropping ${coll.name}: ${err.message}`));
       console.log(`💥 DROPPED (DELETED) Collection Structure: ${coll.name}`);
    }

    console.log("\n💀 ABSOLUTE DESTRUCTION COMPLETE. DATABASE IS PURE VACUUM EMPTY!");
    process.exit(0);
  } catch (error) {
    console.error(`❌ DESTRUCTION FAILED: ${error.message}`);
    process.exit(1);
  }
};

dropEntireDatabase();
