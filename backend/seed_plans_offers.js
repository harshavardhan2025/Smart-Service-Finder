import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "./models/Plan.js";
import Offer from "./models/Offer.js";

dotenv.config();

const PLANS = [
  {
    title: "Basic Care Package",
    price: "₹999",
    period: "month",
    popular: false,
    color: "#3b82f6",
    btnText: "Get Started",
    desc: "Essential maintenance package for apartments & small homes",
    features: [
      "✅ 2 free service visits/month",
      "✅ Plumbing, Electrical & Carpentry",
      "✅ Free diagnostic inspection",
      "✅ Email & In-App support",
      "❌ 0% Platform booking fees",
      "❌ Dedicated home expert"
    ],
    city: "All",
    expiryDate: new Date("2030-12-31"),
    endDate: "2030-12-31"
  },
  {
    title: "Home Pro Annual",
    price: "₹2,499",
    period: "month",
    popular: true,
    color: "#eab308",
    btnText: "⭐ Choose Pro",
    desc: "Complete coverage for all home appliances, repairs & cleaning",
    features: [
      "✅ 6 free service visits/month",
      "✅ All Home Services & Appliance Repair",
      "✅ Priority 2-hr emergency arrival",
      "✅ 0% Platform booking fees",
      "✅ Phone, WhatsApp & Chat support",
      "✅ 10% Cashbacks on all bookings"
    ],
    city: "All",
    expiryDate: new Date("2030-12-31"),
    endDate: "2030-12-31"
  },
  {
    title: "Elite Master VIP",
    price: "₹19,999",
    period: "year",
    popular: false,
    color: "#8b5cf6",
    btnText: "🚀 Go Elite",
    desc: "VIP unlimited service plan for luxury villas, residences & families",
    features: [
      "✅ Unlimited free service visits",
      "✅ Full coverage across ALL 30+ service categories",
      "✅ 30-min guaranteed rapid emergency dispatch",
      "✅ Dedicated personal home manager & expert",
      "✅ Free annual deep house cleaning & AC overhaul",
      "✅ 24/7 Priority hotline & SOS response"
    ],
    city: "All",
    expiryDate: new Date("2030-12-31"),
    endDate: "2030-12-31"
  },
  {
    title: "Commercial Property Plan",
    price: "₹39,999",
    period: "year",
    popular: false,
    color: "#10b981",
    btnText: "🏢 Commercial Plan",
    desc: "Complete maintenance management for offices, shops & clinics",
    features: [
      "✅ Unlimited commercial maintenance visits",
      "✅ Electrical, HVAC, Plumbing & Cleaning",
      "✅ Dedicated technician team assigned",
      "✅ Monthly safety & audit reports",
      "✅ GST Invoice & Corporate Billing"
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
