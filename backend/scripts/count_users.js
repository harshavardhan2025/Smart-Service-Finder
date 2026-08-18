import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serviceApp");
  const users = await User.find({});
  
  const countByRole = {};
  for (const u of users) {
    countByRole[u.role] = (countByRole[u.role] || 0) + 1;
  }
  
  console.log(`Total Users: ${users.length}`);
  console.log('By Role:', countByRole);
  
  const admins = users.filter(u => u.role === 'admin').map(u => ({name: u.name, email: u.email}));
  const normalUsers = users.filter(u => u.role === 'user').map(u => ({name: u.name, email: u.email}));
  const workersSample = users.filter(u => u.role === 'worker').slice(0, 5).map(u => ({name: u.name, email: u.email}));

  console.log('\nAdmins:', admins);
  console.log('\nNormal Users:', normalUsers);
  console.log('\nSample Workers:', workersSample);

  process.exit(0);
}
run();
