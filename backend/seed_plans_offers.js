import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "./models/Plan.js";
import Offer from "./models/Offer.js";

dotenv.config();

const PLANS = [
  {
    title: "Starter Plan",
    price: "₹999",
    period: "month",
    popular: false,
    color: "#3b82f6",
    btnText: "Get Started",
    desc: "Good for small houses and basic needs.",
    features: [
      "✅ 2 free visits a month",
      "✅ Basic repairs (Plumbing, Electrical, Carpentry)",
      "✅ Free check-up",
      "✅ Basic chat support",
      "❌ Extra booking fees apply",
      "❌ No personal helper"
    ],
    city: "All",
    expiryDate: new Date("2030-12-31"),
    endDate: "2030-12-31"
  },
  {
    title: "Pro Plan",
    price: "₹2,499",
    period: "month",
    popular: true,
    color: "#eab308",
    btnText: "⭐ Choose Pro",
    desc: "Our most popular plan for regular home care.",
    features: [
      "✅ 6 free visits a month",
      "✅ All repairs and appliance fixing included",
      "✅ Fast 2-hour emergency help",
      "✅ No extra booking fees",
      "✅ Priority phone support",
      "✅ Get 10% cashback on all bookings"
    ],
    city: "All",
    expiryDate: new Date("2030-12-31"),
    endDate: "2030-12-31"
  },
  {
    title: "VIP Plan",
    price: "₹19,999",
    period: "year",
    popular: false,
    color: "#8b5cf6",
    btnText: "🚀 Go VIP",
    desc: "The ultimate plan for big houses and total peace of mind.",
    features: [
      "✅ Unlimited free visits",
      "✅ Everything is covered (30+ services)",
      "✅ Super fast 30-minute emergency help",
      "✅ Your own personal home manager",
      "✅ Free deep house cleaning & AC service yearly",
      "✅ 24/7 VIP hotline"
    ],
    city: "All",
    expiryDate: new Date("2030-12-31"),
    endDate: "2030-12-31"
  },
  {
    title: "Office Plan",
    price: "₹39,999",
    period: "year",
    popular: false,
    color: "#10b981",
    btnText: "🏢 Choose Office Plan",
    desc: "Complete care for your office or shop.",
    features: [
      "✅ Unlimited office visits",
      "✅ All office maintenance covered",
      "✅ Dedicated team for your office",
      "✅ Monthly safety reports",
      "✅ Business billing with GST"
    ],
    city: "All",
    expiryDate: new Date("2030-12-31"),
    endDate: "2030-12-31"
  }
];

const OFFERS = [
  {
    code: "WELCOME100",
    discount: "Flat ₹100 Off",
    desc: "Valid on all service bookings for new clients",
    expiry: "Valid till Dec 31, 2028",
    expiryDate: new Date("2028-12-31"),
    endDate: "2028-12-31",
    minPrice: 200,
    city: "All",
    validServices: "All"
  },
  {
    code: "WORKZY20",
    discount: "20% Off",
    desc: "Get 20% off on Plumbing, Electrical & Carpentry repairs",
    expiry: "Valid till Dec 31, 2028",
    expiryDate: new Date("2028-12-31"),
    endDate: "2028-12-31",
    minPrice: 250,
    city: "All",
    validServices: "Plumbing, Electrical, Carpentry"
  },
  {
    code: "FESTIVE25",
    discount: "25% Off",
    desc: "Festive season special discount across all plans and services",
    expiry: "Valid till Dec 31, 2028",
    expiryDate: new Date("2028-12-31"),
    endDate: "2028-12-31",
    minPrice: 300,
    city: "All",
    validServices: "All"
  },
  {
    code: "COOLAC150",
    discount: "Flat ₹150 Off",
    desc: "Flat ₹150 off on AC Repair & Servicing",
    expiry: "Valid till Dec 31, 2028",
    expiryDate: new Date("2028-12-31"),
    endDate: "2028-12-31",
    minPrice: 400,
    city: "All",
    validServices: "AC Repair"
  },
  {
    code: "CLEANPRO",
    discount: "15% Off",
    desc: "15% off on Deep House Cleaning & Floor Cleaning",
    expiry: "Valid till Dec 31, 2028",
    expiryDate: new Date("2028-12-31"),
    endDate: "2028-12-31",
    minPrice: 500,
    city: "All",
    validServices: "House Cleaning, Floor cleaning"
  },
  {
    code: "DOCFREE",
    discount: "Flat ₹150 Off",
    desc: "Flat ₹150 off on Doctors & Medical consult bookings",
    expiry: "Valid till Dec 31, 2028",
    expiryDate: new Date("2028-12-31"),
    endDate: "2028-12-31",
    minPrice: 300,
    city: "All",
    validServices: "Doctors & Medical"
  }
];

async function seedPlansOffers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing
    await Plan.deleteMany({});
    await Offer.deleteMany({});
    console.log("🗑️  Cleared existing plans & offers");

    // Insert fresh data
    const insertedPlans = await Plan.insertMany(PLANS);
    const insertedOffers = await Offer.insertMany(OFFERS);

    console.log(`✅ Inserted ${insertedPlans.length} plans`);
    console.log(`✅ Inserted ${insertedOffers.length} offers`);

    console.log("\n📋 Plans seeded:");
    insertedPlans.forEach(p => console.log(`   - ${p.title} @ ${p.price}`));
    console.log("\n🏷️  Offers seeded:");
    insertedOffers.forEach(o => console.log(`   - ${o.code}: ${o.discount}`));

    console.log("\n🎉 Done! Plans & Offers seeded successfully.");
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedPlansOffers();
