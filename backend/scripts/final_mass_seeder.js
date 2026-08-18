import mongoose from "mongoose";
import dotenv from "dotenv";
import Worker from "./models/Worker.js";
import User from "./models/User.js";
import { geocodeCity } from "./utils/geoUtils.js";

dotenv.config();

const definitions = [
  // 1. Plumbing
  { name: "Srinivas Rao", email: "plumber1@workzy.com", service: "Plumbing", price: 299 },
  { name: "Raju Plumber", email: "plumber2@workzy.com", service: "Plumbing", price: 250 },
  // 2. Electrical
  { name: "Ganesh Prasad", email: "electrician1@workzy.com", service: "Electrical", price: 399 },
  { name: "Satya Murthy", email: "electrician2@workzy.com", service: "Electrical", price: 450 },
  // 3. Carpentry
  { name: "Sai Teja", email: "carpenter1@workzy.com", service: "Carpentry", price: 499 },
  { name: "Veerraju", email: "carpenter2@workzy.com", service: "Carpentry", price: 599 },
  // 4. AC Repair
  { name: "Harsha Vardhan", email: "ac1@workzy.com", service: "AC Repair", price: 799 },
  { name: "Prasad Rao", email: "ac2@workzy.com", service: "AC Repair", price: 850 },
  // 5. Washing Machine
  { name: "Ravi Kumar", email: "washing1@workzy.com", service: "Washing Machine", price: 550 },
  // 6. Geyser
  { name: "Suresh Babu", email: "geyser1@workzy.com", service: "Geyser", price: 450 },
  // 7. Grinder
  { name: "Naidu wet-grind", email: "grinder1@workzy.com", service: "Grinder", price: 350 },
  // 8. Mixer
  { name: "Chowdary Mixie", email: "mixer1@workzy.com", service: "Mixer", price: 300 },
  // 9. Refrigerator
  { name: "Kiran Fridge", email: "fridge1@workzy.com", service: "Refrigerator", price: 750 },
  // 10. Water Purifier
  { name: "Krishna Murthy", email: "purifier1@workzy.com", service: "Water Purifier", price: 490 },
  // 11. House Cleaning
  { name: "Lakshmi Kumari", email: "cleaning1@workzy.com", service: "House Cleaning", price: 999 },
  // 12. Floor cleaning
  { name: "Ramana Floorcare", email: "floor1@workzy.com", service: "Floor cleaning", price: 699 },
  // 13. Utensils Cleaning
  { name: "Sita Devi", email: "utensils1@workzy.com", service: "Utensils Cleaning", price: 350 },
  // 14. Wall Putty Coating
  { name: "Mohan Putty", email: "putty1@workzy.com", service: "Wall Putty Coating", price: 2500 },
  // 15. Interior Painting
  { name: "Venkatesh Paint", email: "interior1@workzy.com", service: "Interior Painting", price: 3500 },
  // 16. Exterior Painting
  { name: "Apparao Paint", email: "exterior1@workzy.com", service: "Exterior Painting", price: 5500 },
  // 17. Texture & Designer Finishers
  { name: "Subbarao Texture", email: "texture1@workzy.com", service: "Texture & Designer Finishers", price: 4500 },
  // 18. Wallpaper Installation
  { name: "Narayana Walls", email: "wallpaper1@workzy.com", service: "Wallpaper Installation", price: 2999 },
  // 19. Wood Polishing
  { name: "Bhaskar Polish", email: "woodpolish1@workzy.com", service: "Wood Polishing", price: 1999 },
  // 20. Two-Wheeler (Bikes)
  { name: "Vamsi Krishna", email: "bike1@workzy.com", service: "Two-Wheeler (Bikes)", price: 350 },
  // 21. Four-Wheeler (Cars)
  { name: "Suresh Garage", email: "car1@workzy.com", service: "Four-Wheeler (Cars)", price: 1200 },
  // 22. Others (Heavy)
  { name: "Chowdary Heavy", email: "heavy1@workzy.com", service: "Others (Heavy)", price: 8500 },
  // 23. Bike Wash
  { name: "Durga Wash", email: "bikewash1@workzy.com", service: "Bike Wash", price: 150 },
  // 24. Car Wash
  { name: "Rambabu Clean", email: "carwash1@workzy.com", service: "Car Wash", price: 499 },
  // 25. Photography
  { name: "Rao Clickz", email: "photo1@workzy.com", service: "Photography", price: 6500 },
  // 26. Purohit
  { name: "Shastri Purohit", email: "purohit1@workzy.com", service: "Purohit", price: 1500 },
  // 27. Decor
  { name: "Prakash Decor", email: "decor1@workzy.com", service: "Decor", price: 8000 },
  // 28. Mehandi
  { name: "Radha Henna", email: "mehandi1@workzy.com", service: "Mehandi", price: 1800 },
  // 29. Makeup
  { name: "Devi Makeups", email: "makeup1@workzy.com", service: "Makeup", price: 5500 },
  // 30. Beauty, Salon & Spa
  { name: "Sridevi Beauty Salon", email: "beauty1@workzy.com", service: "Beauty, Salon & Spa", price: 1200 },
  // 31. Doctors
  { name: "Dr. Ananya", email: "doctor1@workzy.com", service: "Doctors", price: 500 }
];

const cities = ["Kakinada", "Rajahmundry", "Kadapa"];

const runSeeder = async () => {
  try {
     console.log("🚀 Initiating Mass Deep-Level Dataset Saturation...");
     await mongoose.connect(process.env.MONGO_URI);

     // Wipe existing workers and their user records to allow clean redistribution
     await Worker.deleteMany({});
     await User.deleteMany({ role: "worker" });
     console.log("🧹 Wiped existing worker and user worker records.");
     
     let createdCount = 0;
     for (let i = 0; i < definitions.length; i++) {
        const def = definitions[i];

        for (const assignedCity of cities) {
           // Generate highly-rated authentic random performance metrics flawlessly
           const genRating = (4.0 + Math.random() * 1.0).toFixed(1);
           const genReviews = Math.floor(Math.random() * 80) + 10;
           const exp = (Math.floor(Math.random() * 8) + 2) + "+ Years";

           const locationStr = assignedCity === "Kakinada" ? "Bhanugudi Junction" : 
                               assignedCity === "Rajahmundry" ? "Danavaipeta" : "Kadapa Central Area";
           const coords = await geocodeCity(locationStr);
           
           const emailParts = def.email.split('@');
           const cityEmail = `${emailParts[0]}_${assignedCity.toLowerCase()}@${emailParts[1]}`;
           const displayName = `${def.name} (${assignedCity})`;

           // Step 1: Commit to main Worker Collection
           const finalWorker = await Worker.create({
              name: displayName,
              email: cityEmail,
              service: def.service,
              city: assignedCity,
              location: locationStr,
              lat: coords ? coords.lat : null,
              lon: coords ? coords.lon : null,
              rating: Number(genRating),
              reviews: genReviews,
              price: def.price,
              experience: exp,
              status: "Active"
           });

           // Step 2: Simultaneously guarantee Auth capability instantly!
           await User.create({
              name: displayName,
              email: cityEmail,
              password: "password123", // Def standard password
              role: "worker",
              city: assignedCity
           });
           
           createdCount++;
           console.log(`✅ Inserted ${def.service} Expert: ${displayName} in ${assignedCity}`);
        }
     }

     console.log(`\n🏆 MASS SATURATION COMPLETE! Deployed ${createdCount} active sub-service experts flawlessly!`);
     process.exit(0);
  } catch (err) {
     console.error("Mass Seed FAILED:", err);
     process.exit(1);
  }
};

runSeeder();
