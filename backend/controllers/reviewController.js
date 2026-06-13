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
    if (req.body.booking_id) {
      const existingReview = await Review.findOne({ booking_id: req.body.booking_id });
      if (existingReview) {
        return res.status(409).json({ error: "You have already submitted a review for this booking." });
      }
    }
    const review = await Review.create({
      ...req.body,
      date: new Date().toISOString().slice(0, 10)
    });

    // ⚡ BAYESIAN RATING AGGREGATION
    // Formula: effectiveRating = (W × BASE + ratingSum + newStar) / (W + reviewCount)
    // BASE = 2.7 (new worker baseline), W = 3 (baseline weight)
    if (req.body.worker_id) {
      const BASE_RATING = 2.7;
      const WEIGHT = 3;
      const newStar = Number(req.body.rating || 0);

      // Increment ratingSum and reviews atomically, then fetch fresh values
      const updatedWorker = await Worker.findByIdAndUpdate(
        req.body.worker_id,
        {
          $inc: { ratingSum: newStar, reviews: 1 }
        },
        { new: true }
      );

      if (updatedWorker) {
        const reviewCount = updatedWorker.reviews;
        const sumStars = updatedWorker.ratingSum;
        // Bayesian blended rating, rounded to 1 decimal
        const bayesRating = Math.round(
          ((WEIGHT * BASE_RATING + sumStars) / (WEIGHT + reviewCount)) * 10
        ) / 10;
        // Clamp to valid 1.0 – 5.0 range
        const finalRating = Math.min(5.0, Math.max(1.0, bayesRating));

        await Worker.findByIdAndUpdate(req.body.worker_id, { rating: finalRating });

        // Notify the worker
        try {
          const workerUser = await User.findOne({ email: updatedWorker.email });
          if (workerUser) {
            await Notification.create({
              role: "worker",
              user_id: workerUser._id.toString(),
              title: "⭐️ New Review Received!",
              message: `${review.customer_name} left you a ${review.rating}-star review. Your new rating is ${finalRating} ⭐`,
              type: "info",
              is_read: false
            });
          }
        } catch (err) {
          console.error("Error creating review notification:", err);
        }
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
