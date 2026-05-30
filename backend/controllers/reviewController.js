import Review from "../models/Review.js";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";

export const getReviews = async (req, res) => {
  try {
    const filter = {};
    if (req.query.customer_name) filter.customer_name = req.query.customer_name;
    if (req.query.worker_id) filter.worker_id = req.query.worker_id;
    
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const review = await Review.create({
      ...req.body,
      date: new Date().toISOString().slice(0, 10)
    });

    // ⚡ REAL-TIME DYNAMIC RATING AGGREGATION: Automatically sync stats with physical Worker profile!
    if (req.body.worker_id) {
       const workerReviews = await Review.find({ worker_id: req.body.worker_id });
       const totalCount = workerReviews.length;
       const rawSum = workerReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
       
       // Force exact math with a standard 1-decimal place rounding
       const avgRating = totalCount > 0 ? Math.round((rawSum / totalCount) * 10) / 10 : 3.0;
       
       await Worker.findByIdAndUpdate(req.body.worker_id, {
          rating: avgRating,
          reviews: totalCount
       });

       // Create targeted notification for the worker
       try {
         const worker = await Worker.findById(req.body.worker_id);
         if (worker) {
           const workerUser = await User.findOne({ email: worker.email });
           if (workerUser) {
             await Notification.create({
               role: "worker",
               user_id: workerUser._id.toString(),
               title: "⭐️ New Review Received!",
               message: `${review.customer_name} left you a ${review.rating}-star review: "${review.comment || 'No comment text provided.'}"`,
               type: "info",
               is_read: false
             });
           }
         }
       } catch (err) {
         console.error("Error creating review notification for worker:", err);
       }
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const replyReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        reply,
        replyDate: new Date().toISOString().slice(0, 10)
      },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: "Review not found" });

    // Notify customer about the response to their review
    try {
      if (review.booking_id) {
        const booking = await Booking.findById(review.booking_id);
        if (booking) {
          await Notification.create({
            role: "user",
            user_id: booking.customer_id,
            title: "💬 Response to your Review",
            message: `A service provider replied to your review: "${reply}"`,
            type: "info",
            is_read: false
          });
        }
      }
    } catch (err) {
      console.error("Error creating review reply notification:", err);
    }

    res.status(200).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
