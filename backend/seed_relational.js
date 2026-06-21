import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Import all models
import User from "./models/User.js";
import Worker from "./models/Worker.js";
import Booking from "./models/Booking.js";
import Transaction from "./models/Transaction.js";
import Review from "./models/Review.js";
import Plan from "./models/Plan.js";
import Offer from "./models/Offer.js";
import Complaint from "./models/Complaint.js";
import Service from "./models/Service.js";
import { geocodeCity } from "./utils/geoUtils.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/serviceApp";

const CITIES = ["Kakinada", "Rajahmundry", "New Delhi", "Hyderabad", "Kadapa", "Kallara", "Chittauri", "Chittoor", "Kurnool"];
const SERVICES = [
  "AC Repair", "Plumbing", "Carpentry", "Electrical", 
  "House Cleaning", "Doctors & Medical", "Interior Painting", 
  "Packers & Movers", "Two-Wheeler (Bikes)", "Four-Wheeler (Cars)"
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected seamlessly!");

    console.log("Wiping existing database to enforce clean relational architecture...");
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});
    await Transaction.deleteMany({});
    await Review.deleteMany({});
    await Plan.deleteMany({});
    await Offer.deleteMany({});
    await Complaint.deleteMany({});
    await Service.deleteMany({});

    console.log("Generating Users...");
    
    const admin = await User.create({
      name: "Super Admin",
      email: "amdin@workzy.com",
      password: "password123",
      role: "admin",
      phone: "9999999999",
      city: "New Delhi",
      walletBalance: 100000
    });

    const admin2 = await User.create({
      name: "Old Admin",
      email: "amdin2@workzy.com",
      password: "password123",
      role: "admin",
      phone: "9999999998",
      city: "New Delhi",
      walletBalance: 100000
    });

    const standardUser = await User.create({
      name: "Harsha User",
      email: "user@harsha.com",
      password: "password123",
      role: "user",
      phone: "9876543210",
      city: "Kakinada",
      walletBalance: 5000
    });

    const testAdmin = await User.create({
      name: "Admin Master",
      email: "amdin3@workzy.com",
      password: "password123",
      role: "admin",
      phone: "9876543211",
      city: "Rajahmundry",
      walletBalance: 100000
    });

    const testWorkerUser = await User.create({
      name: "Suresh Worker",
      email: "worker@harsha.com",
      password: "password123",
      role: "worker",
      phone: "9876543212",
      city: "Rajahmundry",
      walletBalance: 5000
    });

    const CITY_BASE_COORDS = {
      "Kakinada": { lat: 16.98906, lon: 82.24747 },
      "Rajahmundry": { lat: 17.00053, lon: 81.80403 },
      "New Delhi": { lat: 28.6139, lon: 77.2090 },
      "Hyderabad": { lat: 17.3850, lon: 78.4867 },
      "Kadapa": { lat: 14.4673, lon: 78.8242 },
      "Kallara": { lat: 8.7039, lon: 76.9439 },
      "Chittauri": { lat: 26.5414, lon: 82.2356 },
      "Chittoor": { lat: 13.2172, lon: 79.1003 },
      "Kurnool": { lat: 15.8281, lon: 78.0373 }
    };

    let sureshCoords = CITY_BASE_COORDS["Rajahmundry"];
    const testWorkerProfile = await Worker.create({
      name: "Suresh Worker",
      email: "worker@harsha.com",
      service: "Plumbing",
      city: "Rajahmundry",
      location: "Rajahmundry Central Area",
      lat: sureshCoords ? sureshCoords.lat : null,
      lon: sureshCoords ? sureshCoords.lon : null,
      rating: 4.8,
      reviews: 50,
      price: 350,
      experience: "8+ Years"
    });

    console.log("Generating Dynamic Workers across Cities & Services...");
    const createdWorkers = [];
    
    const FIRST_NAMES = ["Ramesh", "Suresh", "Rahul", "Vikram", "Anjali", "Pooja", "Kiran", "Arjun", "Sunita", "Deepak", "Amit", "Neha", "Ravi", "Manoj", "Anita", "Prakash", "Sanjay", "Kavita", "Vikas", "Rekha"];
    const LAST_NAMES = ["Sharma", "Verma", "Reddy", "Rao", "Kumar", "Singh", "Patel", "Das", "Yadav", "Gupta", "Nair", "Iyer", "Chowdary", "Naidu", "Jain"];
    
    let workerCounter = 0;
    for (const city of CITIES) {
      const base = CITY_BASE_COORDS[city] || { lat: 19.0760, lon: 72.8777 };
      for (const service of SERVICES) {
        
        const f1 = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const l1 = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const name1 = `${f1} ${l1}`;
        
        const f2 = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const l2 = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const name2 = `${f2} ${l2}`;
        
        const locStr1 = `${city} Central Area`;
        const coords1 = {
          lat: base.lat + (Math.random() - 0.5) * 0.02,
          lon: base.lon + (Math.random() - 0.5) * 0.02
        };
        workerCounter++;
        const email1 = `${f1.toLowerCase()}.${l1.toLowerCase()}${workerCounter}@workers.com`;
        const w1 = await Worker.create({
          name: name1,
          email: email1,
          service: service,
          city: city,
          location: locStr1,
          lat: coords1.lat,
          lon: coords1.lon,
          rating: (4.5 + Math.random() * 0.5).toFixed(1),
          reviews: Math.floor(Math.random() * 150) + 10,
          price: Math.floor(Math.random() * 500) + 300,
          experience: "5+ Years"
        });
        
        await User.create({
          name: name1,
          email: email1,
          password: "password123",
          role: "worker",
          phone: "9" + Math.floor(100000000 + Math.random() * 900000000).toString(),
          city: city,
          walletBalance: 0
        });
        
        const locStr2 = `${city} Suburbs`;
        const coords2 = {
          lat: base.lat + (Math.random() - 0.5) * 0.05,
          lon: base.lon + (Math.random() - 0.5) * 0.05
        };
        workerCounter++;
        const email2 = `${f2.toLowerCase()}.${l2.toLowerCase()}${workerCounter}@workers.com`;
        const w2 = await Worker.create({
          name: name2,
          email: email2,
          service: service,
          city: city,
          location: locStr2,
          lat: coords2.lat,
          lon: coords2.lon,
          rating: (3.8 + Math.random() * 0.7).toFixed(1),
          reviews: Math.floor(Math.random() * 50) + 2,
          price: Math.floor(Math.random() * 200) + 150,
          experience: "2+ Years"
        });

        await User.create({
          name: name2,
          email: email2,
          password: "password123",
          role: "worker",
          phone: "9" + Math.floor(100000000 + Math.random() * 900000000).toString(),
          city: city,
          walletBalance: 0
        });
        
        createdWorkers.push(w1, w2);
      }
    }

    console.log("Generating Structural Services (Categories)...");
    for (const service of SERVICES) {
      await Service.create({
        name: service,
        icon: "🛠️",
        provider: "Verified Independent",
        price: 300
      });
    }

    console.log("Generating Plans & Offers...");
    const p1 = await Plan.create({
      title: "🩺 Doctors Annual Family Plan",
      price: "₹2,999",
      features: ["Unlimited doctor home consultations", "24/7 helpdesk"],
      color: "#0284c7",
      btnText: "Subscribe",
      expiryDate: new Date("2030-01-01")
    });
    const p2 = await Plan.create({
      title: "🚗 Unlimited Annual Car Wash Plan",
      price: "₹1,499",
      features: ["2 Detailed washes per month", "Complimentary wax"],
      color: "#16a34a",
      btnText: "Subscribe 🚀",
      expiryDate: new Date("2030-01-01")
    });

    await Offer.create({ code: "DOCFREE", discount: "Flat ₹150 Off", desc: "Valid on all Doctor consults.", expiry: "Ends Dec 31", expiryDate: new Date("2026-12-31") });
    await Offer.create({ code: "FESTIVE25", discount: "25% Discount", desc: "Enjoy savings on all services.", expiry: "Ends Dec 31", expiryDate: new Date("2026-12-31") });

    console.log("Weaving Relational History (Bookings, Transactions, Reviews)...");
    
    // Create 3 historical bookings for the Standard User using random workers from their city (Kakinada)
    const kakinadaWorkers = createdWorkers.filter(w => w.city === "Kakinada");
    
    for (let i = 0; i < 3; i++) {
       const worker = kakinadaWorkers[Math.floor(Math.random() * kakinadaWorkers.length)];
       
       // 1. Booking
       const booking = await Booking.create({
          customer_id: standardUser._id.toString(),
          customer_name: standardUser.name,
          worker_id: worker._id.toString(),
          date: new Date().toLocaleDateString('en-CA'),
          time: "10:00 AM",
          service: worker.service,
          price: worker.price,
          address: `${worker.location || "Central Area"}, ${worker.city}`,
          status: i === 0 ? "Upcoming" : "Completed" // First is upcoming, rest completed
       });

       // 2. Transaction
       await Transaction.create({
          customer: standardUser.name,
          worker: worker.name,
          service: worker.service,
          amount: worker.price,
          status: "Paid",
          method: "Wallet"
       });

       // 3. Review (Only for completed)
       if (booking.status === "Completed") {
          await Review.create({
             booking_id: booking._id.toString(),
             service: worker.service,
             customer_name: standardUser.name,
             worker_id: worker._id.toString(),
             rating: 5,
             comment: "Excellent service! Highly recommended.",
             date: new Date().toLocaleDateString('en-CA')
          });
       }
       
       // 4. Complaint (Only 1 dummy complaint)
       if (i === 1) {
          await Complaint.create({
             booking_id: booking._id.toString(),
             issue_type: "SUPPORT TICKET: WORKER",
             description: "Worker was 15 minutes late.",
             reported_by: standardUser.name,
             status: "Resolved",
             admin_verdict: "Valid"
          });
       }
    }

    console.log("Database Relational Population 100% Complete! 🏆");
    process.exit();
  } catch (error) {
    console.error("Seeding Failed:", error);
    process.exit(1);
  }
};

seedDatabase();
