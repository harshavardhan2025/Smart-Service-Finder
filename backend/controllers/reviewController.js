import Review from "../models/Review.js";
import Worker from "../models/Worker.js";

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
    }

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
