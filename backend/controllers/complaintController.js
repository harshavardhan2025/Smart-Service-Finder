import Complaint from "../models/Complaint.js";

export const getComplaints = async (req, res) => {
  try {
    const list = await Complaint.find().sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const submitComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.create(req.body);
    res.status(201).json({ success: true, complaint });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const resolveComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { admin_verdict: req.body.verdict, status: "Resolved" },
      { new: true }
    );
    res.status(200).json({ success: true, resolved: complaint });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
