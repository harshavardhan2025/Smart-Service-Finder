import Review from "../models/Review.js";

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
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
