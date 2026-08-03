import Plan from "../models/Plan.js";

export const getPlans = async (req, res) => {
  try {
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
