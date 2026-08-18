import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Message from "./models/Message.js";

dotenv.config();

async function run() {
  // Simulate: customer sends a message via the API
  const customerUserId = "6a1d23a7cb9500a92f408062"; // harsha
  const bookingId = "6a36ca6ed9dabde0a4bdcfd3";
  
  const token = jwt.sign(
    { id: customerUserId }, 
    process.env.JWT_SECRET || "TEMPORARY_EMERGENCY_KEY_PLEASE_CONFIGURE_ENV",
    { expiresIn: "1h" }
  );
  
  console.log("Testing POST /api/chat/booking/ as customer...");
  const postRes = await fetch(`http://localhost:5000/api/chat/booking/${bookingId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ text: "Hello from customer test!" })
  });
  
  const postBody = await postRes.json();
  console.log("POST Status:", postRes.status);
  console.log("POST Body:", JSON.stringify(postBody, null, 2));
  
  console.log("\nTesting GET /api/chat/booking/ as customer...");
  const getRes = await fetch(`http://localhost:5000/api/chat/booking/${bookingId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  const getBody = await getRes.json();
  console.log("GET Status:", getRes.status);
  console.log("GET Messages count:", Array.isArray(getBody) ? getBody.length : "NOT ARRAY");
  if (Array.isArray(getBody)) {
    getBody.forEach(m => console.log(`  [${m.sender_id}] ${m.text}`));
  }
  
  // Now test as worker
  const workerUserId = "6a23062356286bfe1c953179"; // Sai Teja's User._id
  const workerToken = jwt.sign(
    { id: workerUserId },
    process.env.JWT_SECRET || "TEMPORARY_EMERGENCY_KEY_PLEASE_CONFIGURE_ENV",
    { expiresIn: "1h" }
  );
  
  console.log("\nTesting POST /api/chat/booking/ as worker...");
  const wPostRes = await fetch(`http://localhost:5000/api/chat/booking/${bookingId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${workerToken}`
    },
    body: JSON.stringify({ text: "Hello from worker test!" })
  });
  
  const wPostBody = await wPostRes.json();
  console.log("POST Status:", wPostRes.status);
  console.log("POST Body:", JSON.stringify(wPostBody, null, 2));
  
  console.log("\nTesting GET /api/chat/booking/ as worker...");
  const wGetRes = await fetch(`http://localhost:5000/api/chat/booking/${bookingId}`, {
    headers: { "Authorization": `Bearer ${workerToken}` }
  });
  
  const wGetBody = await wGetRes.json();
  console.log("GET Status:", wGetRes.status);
  console.log("GET Messages count:", Array.isArray(wGetBody) ? wGetBody.length : "NOT ARRAY");
  if (Array.isArray(wGetBody)) {
    wGetBody.forEach(m => console.log(`  [${m.sender_id}] ${m.text}`));
  }
  
  // Clean up test messages
  console.log("\nCleaning up test messages...");
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
  await Message.deleteMany({ booking_id: bookingId, text: { $in: ["Hello from customer test!", "Hello from worker test!"] } });
  console.log("Done!");
  
  process.exit(0);
}
run();
