import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const wipeDatabase = async () => {
  try {
    await connectDB();
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`🚮 FOUND ${collections.length} COLLECTIONS TO PURGE.`);
    
    for (let coll of collections) {
       await mongoose.connection.db.collection(coll.name).deleteMany({});
       console.log(`🧹 WIPED Collection: ${coll.name}`);
    }

    console.log("\n🔥 ABSOLUTE DATA ERASE COMPLETED. DATABASE IS 100% EMPTY!");
    process.exit(0);
  } catch (error) {
    console.error(`❌ WIPE FAILED: ${error.message}`);
    process.exit(1);
  }
};

wipeDatabase();
