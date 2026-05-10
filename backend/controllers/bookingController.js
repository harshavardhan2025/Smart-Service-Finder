import Booking from "../models/Booking.js";
import Worker from "../models/Worker.js";
import Transaction from "../models/Transaction.js";

export const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create(req.body);
    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customer_id) filter.customer_id = req.query.customer_id;
    if (req.query.worker_id) filter.worker_id = req.query.worker_id;

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json({ success: true, updated: booking });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const releaseEscrow = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: "Paid Out" }, { new: true });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Execute the direct balance hydration on the assigned worker document atomicly
    await Worker.findByIdAndUpdate(booking.worker_id, { $inc: { walletBalance: booking.price } });

    // Formally audit and record this cash event in transaction database
    await Transaction.create({
       customer: booking.customer_id,
       worker: booking.worker_id,
       service: booking.service,
       amount: booking.price,
       status: "Paid Out",
       method: "Admin Escrow Release"
    });

    res.status(200).json({ success: true, message: "Fund distribution successfully propagated globally." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
