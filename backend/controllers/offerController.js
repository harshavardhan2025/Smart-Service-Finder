import Offer from "../models/Offer.js";

const DEFAULT_OFFERS = [
  {
    code: "EGOD20",
    discount: "20% Off",
    desc: "Get 20% off on all services",
    expiry: "Valid till Dec 31, 2030",
    endDate: "2030-12-31",
    minPrice: 200,
    validServices: "All"
  },
  {
    code: "WELCOME100",
    discount: "Flat ₹100 Off",
    desc: "Valid on all service bookings for new clients",
    expiry: "Valid till Dec 31, 2030",
    endDate: "2030-12-31",
    minPrice: 200,
    validServices: "All"
  },
  {
    code: "WORKZY20",
    discount: "20% Off",
    desc: "Get 20% off on Plumbing, Electrical & Carpentry repairs",
    expiry: "Valid till Dec 31, 2030",
    endDate: "2030-12-31",
    minPrice: 250,
    validServices: "Plumbing, Electrical, Carpentry"
  },
  {
    code: "FESTIVE25",
    discount: "25% Off",
    desc: "Festive season special discount across all plans and services",
    expiry: "Valid till Dec 31, 2030",
    endDate: "2030-12-31",
    minPrice: 300,
    validServices: "All"
  }
];

export const getOffers = async (req, res) => {
  try {
    const count = await Offer.countDocuments();
    if (count === 0) {
      await Offer.insertMany(DEFAULT_OFFERS);
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
    const offers = await Offer.find(filter);
    res.status(200).json(offers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createOffer = async (req, res) => {
  try {
    const { code } = req.body;
    if (code) {
      const existingOffer = await Offer.findOne({ code: { $regex: new RegExp(`^${code.trim()}$`, "i") } });
      if (existingOffer) {
        return res.status(409).json({ error: "An offer with this code already exists." });
      }
    }
    const offer = await Offer.create(req.body);
    res.status(201).json({ success: true, offer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { code } = req.body;
    if (code) {
      const existingOffer = await Offer.findOne({
        _id: { $ne: req.params.id },
        code: { $regex: new RegExp(`^${code.trim()}$`, "i") }
      });
      if (existingOffer) {
        return res.status(409).json({ error: "An offer with this code already exists." });
      }
    }
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, offer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Offer deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
