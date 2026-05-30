import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
  try {
    const { role, user_id } = req.query;
    let filter = {};
    
    if (role) {
      if (user_id) {
        filter = {
          $or: [
            { role: role, user_id: user_id },
            { role: role, user_id: { $exists: false } },
            { role: role, user_id: "" },
            { role: role, user_id: null },
            { role: "all", user_id: { $exists: false } },
            { role: "all", user_id: "" },
            { role: "all", user_id: null }
          ]
        };
      } else {
        filter = { $or: [{ role }, { role: "all" }] };
      }
    } else if (user_id) {
      filter = { user_id };
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
    const { role, user_id } = req.body;
    let filter = {};
    
    if (user_id) {
      filter = {
        $or: [
          { role: role, user_id: user_id },
          { role: role, user_id: { $exists: false } },
          { role: role, user_id: "" },
          { role: role, user_id: null },
          { role: "all", user_id: { $exists: false } },
          { role: "all", user_id: "" },
          { role: "all", user_id: null }
        ],
        is_read: false
      };
    } else {
      filter = {
        $or: [{ role: role }, { role: "all" }],
        is_read: false
      };
    }

    const result = await Notification.updateMany(filter, { is_read: true });
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
