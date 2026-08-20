import Plan from "../models/Plan.js";

const DEFAULT_PLANS = [
  {
    title: "Regional Unlimited",
    price: "₹199",
    period: "month",
    popular: false,
    desc: "Priority Local Dispatch across your city",
    features: ["✅ Priority Local Dispatch", "✅ 0% Surge on all bookings", "✅ Priority Support"],
    endDate: "2030-12-31"
  },
  {
    title: "Basic Care Package",
    price: "₹999",
    period: "month",
    popular: false,
    desc: "Essential maintenance package for apartments & small homes",
    features: ["✅ 2 free service visits/month", "✅ Plumbing, Electrical & Carpentry", "✅ Free diagnostic inspection", "✅ Email & In-App support"],
    endDate: "2030-12-31"
  },
  {
    title: "Home Pro Annual",
    price: "₹2,499",
    period: "month",
    popular: true,
    desc: "Complete coverage for all home appliances, repairs & cleaning",
    features: ["✅ 6 free service visits/month", "✅ All Home Services & Appliance Repair", "✅ Priority 2-hr emergency arrival", "✅ 0% Platform booking fees", "✅ 10% Cashbacks on all bookings"],
    endDate: "2030-12-31"
  },
  {
    title: "Elite Master VIP",
    price: "₹19,999",
    period: "year",
    popular: false,
    desc: "VIP unlimited service plan for luxury villas, residences & families",
    features: ["✅ Unlimited free service visits", "✅ Full coverage across ALL 30+ service categories", "✅ 30-min guaranteed rapid emergency dispatch", "✅ Dedicated personal home manager & expert"],
    endDate: "2030-12-31"
  }
];

export const getPlans = async (req, res) => {
  try {
    const count = await Plan.countDocuments();
    if (count === 0) {
      await Plan.insertMany(DEFAULT_PLANS);
    }
    const filter = {};
    if (req.query.adminView !== "true") {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      filter.$or = [
        { expiryDate: { $gt: today } },
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { endDate: { $gte: todayStr } },
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: "" }
      ];
    }
    const plans = await Plan.find(filter);
    res.status(200).json(plans);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { title } = req.body;
    if (title) {
      const existingPlan = await Plan.findOne({ title: { $regex: new RegExp(`^${title.trim()}$`, "i") } });
      if (existingPlan) {
        return res.status(409).json({ error: "A subscription plan with this title already exists." });
      }
    }
    const plan = await Plan.create(req.body);
    res.status(201).json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { title } = req.body;
    if (title) {
      const existingPlan = await Plan.findOne({
        _id: { $ne: req.params.id },
        title: { $regex: new RegExp(`^${title.trim()}$`, "i") }
      });
      if (existingPlan) {
        return res.status(409).json({ error: "A subscription plan with this title already exists." });
      }
    }
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deletePlan = async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Plan deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
