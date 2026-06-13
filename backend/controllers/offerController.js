import Offer from "../models/Offer.js";

export const getOffers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.adminView !== "true") {
      filter.$or = [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: { $exists: false } },
        { expiryDate: null }
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
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
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
