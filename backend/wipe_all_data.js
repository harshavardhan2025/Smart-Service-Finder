import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const wipeAllData = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`⚠️ CAUTION: Initiating document purge across ${collections.length} collections...\n`);
    
    for (let coll of collections) {
       console.log(`🧹 Purging records from: ${coll.name}...`);
       await db.collection(coll.name).deleteMany({});
    }

    console.log("\n✅ ALL PHYSICAL DOCUMENTS HAVE BEEN PERMANENTLY ERASED.");
    console.log("🔒 Schemas & Index structures remain intact. Database is clean.");
    process.exit(0);
  } catch (error) {
    console.error(`❌ CRITICAL WIPEOUT FAILURE: ${error.message}`);
    process.exit(1);
  }
};

wipeAllData();
