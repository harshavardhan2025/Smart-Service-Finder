import mongoose from "mongoose";
import dotenv from "dotenv";
import Plan from "./models/Plan.js";
import Offer from "./models/Offer.js";

dotenv.config();

const PLANS = [
  {
    title: "Basic Care",
    price: "₹999",
    period: "month",
    popular: false,
    color: "#3b82f6",
    btnText: "Get Started",
    features: [
      "✅ 2 service visits/month",
      "✅ Plumbing & Electrical",
      "✅ Standard response time",
      "✅ Email support",
      "❌ Priority booking",
      "❌ Dedicated expert",
    ],
  },
  {
    title: "Home Pro",
    price: "₹2,499",
    period: "month",
    popular: true,
    color: "#eab308",
    btnText: "⭐ Choose Pro",
    features: [
      "✅ 6 service visits/month",
      "✅ All home services",
      "✅ Priority 2-hr response",
      "✅ Phone & chat support",
      "✅ Priority booking",
      "❌ Dedicated expert",
    ],
  },
  {
    title: "Elite Annual",
    price: "₹19,999",
    period: "year",
    popular: false,
    color: "#8b5cf6",
    btnText: "🚀 Go Elite",
    features: [
      "✅ Unlimited service visits",
      "✅ All home services",
      "✅ 30-min guaranteed response",
      "✅ 24/7 dedicated support",
      "✅ Priority booking always",
      "✅ Personal home expert",
    ],
  },
];

const OFFERS = [
  {
    code: "WELCOME50",
    discount: "₹50 OFF",
    desc: "Welcome discount for new users on first booking",
    expiry: "Valid till 31 Dec 2026",
  },
  {
    code: "FESTIVE25",
    discount: "25% OFF",
    desc: "Festive season discount on all service plans",
    expiry: "Valid till 30 Jun 2026",
  },
  {
    code: "PROPLAN150",
    discount: "₹150 OFF",
    desc: "Flat ₹150 off on Home Pro monthly plan",
    expiry: "Valid till 31 Jul 2026",
  },
  {
    code: "ELITE500",
    discount: "₹500 OFF",
    desc: "Exclusive ₹500 off on Elite Annual plan",
    expiry: "Valid till 31 Aug 2026",
  },
  {
    code: "FIRSTBOOK",
    discount: "10% OFF",
    desc: "10% off on your first service booking",
    expiry: "Valid till 31 Dec 2026",
  },
  {
    code: "DOCFREE",
    discount: "FREE Consultation",
    desc: "Free doctor consultation for new Elite subscribers",
    expiry: "Valid till 30 Sep 2026",
  },
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
