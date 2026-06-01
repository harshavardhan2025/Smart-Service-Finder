import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Worker from "./models/Worker.js";
import Service from "./models/Service.js";
import Offer from "./models/Offer.js";
import Plan from "./models/Plan.js";
import Complaint from "./models/Complaint.js";
import Booking from "./models/Booking.js";
import Review from "./models/Review.js";
import Notification from "./models/Notification.js";
import Transaction from "./models/Transaction.js";
import { geocodeCity } from "./utils/geoUtils.js";

dotenv.config();

const megaEcosystemHydration = async () => {
  try {
    await connectDB();

    // 1. HARD GLOBAL WIPE
    console.log("🔥 INITIATING ABSOLUTE DEEP WIPE ON ALL COLLECTIONS...");
    await User.deleteMany();
    await Worker.deleteMany();
    await Service.deleteMany();
    await Offer.deleteMany();
    await Plan.deleteMany();
    await Complaint.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Notification.deleteMany();
    await Transaction.deleteMany();
    console.log("🧹 ALL 10 TABLES ARE NOW ABSOLUTE ZERO.");

    // 2. SEED SERVICES CATALOGUE
    await Service.insertMany([
      { name: "Plumbing", icon: "🔧" }, { name: "Electrical", icon: "⚡" },
      { name: "Carpentry", icon: "🪚" }, { name: "Haircut (Men)", icon: "💇‍♂️" },
      { name: "Two-Wheeler (Bikes)", icon: "🏍️" }, { name: "Car Wash", icon: "🧼" },
      { name: "House Cleaning", icon: "🏠" }, { name: "Photography", icon: "📸" },
      { name: "Doctors & Medical", icon: "🩺" }, { name: "Interior Painting", icon: "🏠" }
    ]);
    console.log("✅ 1. SERVICES SEEDED.");

    // 3. EXPLICIT REGIONAL TARGETED USERS (Kakinada & Rajahmundry)
    const testAdmin = await User.create({
      name: "Admin Master",
      email: "amdin@workzy.com",
      password: "password123",
      role: "admin",
      city: "Rajahmundry"
    });

    const testUser = await User.create({
      name: "Harsha User",
      email: "user@harsha.com",
      password: "password123",
      role: "user",
      city: "Kakinada"
    });

    const testWorkerUser = await User.create({
      name: "Suresh Worker",
      email: "worker@harsha.com",
      password: "password123",
      role: "worker",
      city: "Rajahmundry"
    });
    console.log("✅ 2. IDENTITY USERS SEEDED FOR REGION.");

    // 4. TARGETED REGIONAL WORKERS (Linked to Identity when relevant)
    let sureshCoords = await geocodeCity("Rajahmundry");
    const linkedWorker = await Worker.create({
      name: "Suresh Worker",
      email: "worker@harsha.com",
      service: "Plumbing",
      city: "Rajahmundry",
      location: "Rajahmundry",
      lat: sureshCoords ? sureshCoords.lat : null,
      lon: sureshCoords ? sureshCoords.lon : null,
      rating: 4.8,
      price: 350,
      experience: "8+ Years"
    });

    const extraWorkerDefinitions = [
      { name: "Naidu Electricals", email: "naidu@workers.com", service: "Electrical", city: "Rajahmundry", location: "Danavaipeta", rating: 4.9, reviews: 45, price: 450, experience: "10+ Years" },
      { name: "Chowdary Movers", email: "chowdary@workers.com", service: "Packers & Movers", city: "Kakinada", location: "Main Road", rating: 4.7, reviews: 32, price: 12000, experience: "5+ Years" },
      { name: "Raju Carpentry Works", email: "raju@workers.com", service: "Carpentry", city: "Rajahmundry", location: "Bommarillu", rating: 4.2, reviews: 18, price: 650, experience: "4 Years" },
      { name: "Style King Men Salon", email: "styleking@workers.com", service: "Haircut (Men)", city: "Kakinada", location: "RTC Complex", rating: 4.5, reviews: 89, price: 299, experience: "6 Years" },
      { name: "Dr. Harini Clinic", email: "drharini@workers.com", service: "Doctors & Medical", city: "Rajahmundry", location: "Pushkar Ghat", rating: 4.9, reviews: 112, price: 500, experience: "12 Years" },
      { name: "Maruti Bike Point", email: "maruti@workers.com", service: "Two-Wheeler (Bikes)", city: "Kakinada", location: "Suryaraopeta", rating: 4.3, reviews: 24, price: 550, experience: "3 Years" },
      { name: "Durga Painters", email: "durga@workers.com", service: "Interior Painting", city: "Rajahmundry", location: "Lala Cheruvu", rating: 3.8, reviews: 12, price: 2500, experience: "2 Years" },
      { name: "Krishna Photography", email: "krishna@workers.com", service: "Photography", city: "Kakinada", location: "Bhanugudi Junction", rating: 5.0, reviews: 15, price: 8000, experience: "7 Years" },
      { name: "CleanPro Services", email: "cleanpro@workers.com", service: "House Cleaning", city: "Kakinada", location: "Jagannaickpur", rating: 4.6, reviews: 41, price: 1800, experience: "5 Years" },

      // 🏰 HYDERABAD REGIONAL WORKERS
      { name: "Hyd Plumbing Care", email: "hydplumbing@workers.com", service: "Plumbing", city: "Hyderabad", location: "Hyderabad Central Area", rating: 4.8, reviews: 36, price: 349, experience: "7 Years" },
      { name: "Deccan Electricals", email: "deccan@workers.com", service: "Electrical", city: "Hyderabad", location: "Hyderabad Suburbs", rating: 4.7, reviews: 29, price: 399, experience: "6 Years" },
      { name: "Nizam Carpentry", email: "nizam@workers.com", service: "Carpentry", city: "Hyderabad", location: "Hyderabad Central Area", rating: 4.5, reviews: 22, price: 599, experience: "5 Years" },
      { name: "Golkonda Men Salon", email: "golkonda@workers.com", service: "Haircut (Men)", city: "Hyderabad", location: "Hyderabad Suburbs", rating: 4.6, reviews: 48, price: 249, experience: "4 Years" },
      { name: "Charminar Painters", email: "charminar@workers.com", service: "Interior Painting", city: "Hyderabad", location: "Hyderabad Central Area", rating: 4.9, reviews: 62, price: 1999, experience: "9 Years" },

      // 🏛️ NEW DELHI REGIONAL WORKERS
      { name: "Delhi Plumbing Hub", email: "delhiplumbing@workers.com", service: "Plumbing", city: "New Delhi", location: "New Delhi Central Area", rating: 4.7, reviews: 40, price: 399, experience: "8 Years" },
      { name: "Capital Electricals", email: "capital@workers.com", service: "Electrical", city: "New Delhi", location: "New Delhi Suburbs", rating: 4.9, reviews: 54, price: 449, experience: "10 Years" },
      { name: "Connaught Carpentry", email: "connaught@workers.com", service: "Carpentry", city: "New Delhi", location: "New Delhi Central Area", rating: 4.4, reviews: 19, price: 699, experience: "4 Years" },
      { name: "Delhi Metro Men Salon", email: "delhimetro@workers.com", service: "Haircut (Men)", city: "New Delhi", location: "New Delhi Suburbs", rating: 4.3, reviews: 31, price: 299, experience: "5 Years" },
      { name: "Yamuna Painters", email: "yamuna@workers.com", service: "Interior Painting", city: "New Delhi", location: "New Delhi Central Area", rating: 4.8, reviews: 75, price: 2499, experience: "11 Years" },

      // ⛰️ KADAPA REGIONAL WORKERS
      { name: "Rayalaseema Plumbers", email: "rayalaseema@workers.com", service: "Plumbing", city: "Kadapa", location: "Kadapa Central Area", rating: 4.8, reviews: 31, price: 299, experience: "6 Years" },
      { name: "Kadapa Power & Light", email: "kadapapower@workers.com", service: "Electrical", city: "Kadapa", location: "Kadapa Suburbs", rating: 4.9, reviews: 43, price: 349, experience: "9 Years" },
      { name: "YSR Carpentry Works", email: "ysrcarpentry@workers.com", service: "Carpentry", city: "Kadapa", location: "Kadapa Central Area", rating: 4.3, reviews: 15, price: 499, experience: "4 Years" },
      { name: "Royal Men Salon", email: "royal@workers.com", service: "Haircut (Men)", city: "Kadapa", location: "Kadapa Suburbs", rating: 4.7, reviews: 52, price: 199, experience: "5 Years" },
      { name: "Palnadu Painters", email: "palnadu@workers.com", service: "Interior Painting", city: "Kadapa", location: "Kadapa Central Area", rating: 4.5, reviews: 21, price: 1499, experience: "3 Years" }
    ];

    // Resolve coordinates for all extra workers at seed-time
    const extraWorkersWithCoords = await Promise.all(
      extraWorkerDefinitions.map(async (w) => {
        let cityStr = "";
        if (w.location && w.city) {
          const locClean = w.location.toLowerCase().trim();
          const cityClean = w.city.toLowerCase().trim();
          if (locClean !== cityClean) {
            cityStr = `${w.location}, ${w.city}`;
          } else {
            cityStr = w.city;
          }
        } else {
          cityStr = w.location || w.city || "";
        }

        let lat = null;
        let lon = null;
        if (cityStr) {
          try {
            const coords = await geocodeCity(cityStr);
            if (coords) {
              lat = coords.lat;
              lon = coords.lon;
            } else if (w.city) {
              const cityCoords = await geocodeCity(w.city);
              if (cityCoords) {
                lat = cityCoords.lat;
                lon = cityCoords.lon;
              }
            }
          } catch (err) {
            console.error(`Geocoding failed for extra seeded worker ${w.name}:`, err.message);
          }
        }

        return { ...w, lat, lon };
      })
    );

    // Insert into Worker collection
    await Worker.insertMany(extraWorkersWithCoords);

    // CRITICAL: Simultaneously Generate Real Login Credentials for All Workers
    await Promise.all(extraWorkerDefinitions.map(async (w) => {
       await User.create({
          name: w.name,
          email: w.email,
          password: "password123",
          role: "worker",
          city: w.city
       });
    }));
    
    console.log("✅ 3. REGIONAL WORKERS SEEDED & LOGIN IDENTITIES CREATED.");

    // 5. HYDRATE INTERACTIVE RELATIONAL DATA (Linking to testUser and linkedWorker)
    
    // Create synthetic Pending Booking ready for acceptance testing
    const newBooking = await Booking.create({
      customer_id: testUser._id.toString(),
      customer_name: testUser.name,
      worker_id: linkedWorker._id.toString(),
      date: "2026-05-11",
      time: "02:00 PM",
      service: "Plumbing",
      price: 450,
      address: "Main Bazaar, Kakinada Downtown",
      status: "Pending"
    });
    console.log("✅ 4. SAMPLE PENDING BOOKING SEEDED FOR DASHBOARD.");

    // Create synthetic Review bound to above booking (matching Review Schema)
    await Review.create({
      booking_id: newBooking._id.toString(),
      customer_name: testUser.name,
      worker_id: linkedWorker._id.toString(),
      rating: 5,
      comment: "Amazing professional plumbing done in Rajahmundry! Highly recommended!",
      date: "2026-05-10"
    });
    console.log("✅ 5. REVIEWS SEEDED.");

    // Create Wallet Transaction bound to above booking (matching Transaction schema)
    await Transaction.create({
      customer: testUser._id.toString(),
      worker: linkedWorker._id.toString(),
      service: "Plumbing",
      amount: 350,
      status: "Paid",
      method: "Wallet"
    });
    console.log("✅ 6. FINANCIAL TRANSACTIONS SEEDED.");

    // Create Synthetic Notifications (matching Notification schema)
    await Notification.create({
      user_id: testUser._id.toString(),
      title: "Booking Confirmed",
      message: "Your service call with Suresh Worker was successful!",
      role: "user",
      type: "success"
    });
    console.log("✅ 7. SYSTEM NOTIFICATIONS SEEDED.");

    // 6. POPULATE AUXILIARY MODULES (Offers, Plans, Tickets)
    await Offer.insertMany([
      { title: "East Godavari Special 20% OFF", discount: "20%", code: "EGOD20", expiry: "2026-12-31", expiryDate: new Date("2026-12-31") }
    ]);
    
    await Plan.insertMany([
      { title: "Regional Unlimited", price: "₹199/mo", features: ["Priority Local Dispatch"], color: "#ffffff", expiryDate: new Date("2030-01-01") }
    ]);

    await Complaint.create({
      reported_by: testUser._id,
      issue_type: "App Navigation",
      description: "Requesting support for testing visual ticket desk flow.",
      status: "Under Review"
    });
    console.log("✅ 8. AUXILIARY TABLES (Offers/Plans/Tickets) SEEDED.");

    console.log("\n🏁🎉 COMPREHENSIVE MEGA ECOSYSTEM SATURATION COMPLETED 100%!");
    process.exit(0);
  } catch (error) {
    console.error(`❌ MEGA SEED FAILED: ${error.message}`);
    process.exit(1);
  }
};

megaEcosystemHydration();
