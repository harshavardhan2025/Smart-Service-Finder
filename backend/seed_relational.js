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

const CITIES = ["Kakinada", "Rajahmundry", "New Delhi", "Hyderabad"];
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
      email: "admin@workzy.com",
      password: "password123",
      role: "admin",
      phone: "9999999999",
      city: "New Delhi",
      walletBalance: 100000
    });

    const admin2 = await User.create({
      name: "Old Admin",
      email: "admin@worxy.com",
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
      email: "admin@harsha.com",
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

    let sureshCoords = await geocodeCity("Rajahmundry Central");
    const testWorkerProfile = await Worker.create({
      name: "Suresh Worker",
      email: "worker@harsha.com",
      service: "Plumbing",
      city: "Rajahmundry",
      location: "Rajahmundry Central",
      lat: sureshCoords ? sureshCoords.lat : null,
      lon: sureshCoords ? sureshCoords.lon : null,
      rating: 4.8,
      reviews: 50,
      price: 350,
      experience: "8+ Years"
    });

    console.log("Generating Dynamic Workers across 4 Cities & 10 Services...");
    const createdWorkers = [];
    
    const FIRST_NAMES = ["Ramesh", "Suresh", "Rahul", "Vikram", "Anjali", "Pooja", "Kiran", "Arjun", "Sunita", "Deepak", "Amit", "Neha", "Ravi", "Manoj", "Anita", "Prakash", "Sanjay", "Kavita", "Vikas", "Rekha"];
    const LAST_NAMES = ["Sharma", "Verma", "Reddy", "Rao", "Kumar", "Singh", "Patel", "Das", "Yadav", "Gupta", "Nair", "Iyer", "Chowdary", "Naidu", "Jain"];
    
    // We want all workers in all services in all 4 locations
    let workerCounter = 0;
    for (const city of CITIES) {
      for (const service of SERVICES) {
        
        const f1 = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const l1 = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const name1 = `${f1} ${l1}`;
        
        const f2 = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const l2 = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const name2 = `${f2} ${l2}`;
        
        const locStr1 = `${city} Central Area`;
        const coords1 = await geocodeCity(locStr1);
        workerCounter++;
        const email1 = `${f1.toLowerCase()}.${l1.toLowerCase()}${workerCounter}@workers.com`;
        const w1 = await Worker.create({
          name: name1,
          email: email1,
          service: service,
          city: city,
          location: locStr1,
          lat: coords1 ? coords1.lat : null,
          lon: coords1 ? coords1.lon : null,
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
        const coords2 = await geocodeCity(locStr2);
        workerCounter++;
        const email2 = `${f2.toLowerCase()}.${l2.toLowerCase()}${workerCounter}@workers.com`;
        const w2 = await Worker.create({
          name: name2,
          email: email2,
          service: service,
          city: city,
          location: locStr2,
          lat: coords2 ? coords2.lat : null,
          lon: coords2 ? coords2.lon : null,
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
      btnText: "Subscribe"
    });
    const p2 = await Plan.create({
      title: "🚗 Unlimited Annual Car Wash Plan",
      price: "₹1,499",
      features: ["2 Detailed washes per month", "Complimentary wax"],
      color: "#16a34a",
      btnText: "Subscribe 🚀"
    });

    await Offer.create({ code: "DOCFREE", discount: "Flat ₹150 Off", desc: "Valid on all Doctor consults.", expiry: "Ends Dec 31" });
    await Offer.create({ code: "FESTIVE25", discount: "25% Discount", desc: "Enjoy savings on all services.", expiry: "Ends Dec 31" });

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
          address: "Kakinada Main Road, 533001",
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
