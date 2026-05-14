import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const { role } = req.query;
    let filter = {};
    
    if (role) {
      filter = { $or: [{ role }, { role: "all" }] };
    }

    const list = await Notification.find(filter).sort({ createdAt: -1 });
    res.status(200).json(list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const alert = await Notification.create(req.body);
    res.status(201).json({ success: true, notification: alert });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { role: req.body.role, is_read: false },
      { is_read: true }
    );
    res.status(200).json({ success: true, count: result.modifiedCount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateNotification = async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, notification: updated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const alert = await Notification.findById(req.params.id);
    res.status(200).json({ success: true, notification: alert });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
