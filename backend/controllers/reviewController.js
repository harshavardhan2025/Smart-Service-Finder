import { supabase } from "../config/supabase.js";

export const getReviews = async (req, res) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("*");

  if (error) {
    return res.status(400).json(error);
  }
  res.json(data);
};

export const createReview = async (req, res) => {
  const { booking_id, customer_name, worker_id, rating, comment } = req.body;

  const { data, error } = await supabase
    .from("reviews")
    .insert([
      {
        booking_id,
        customer_name,
        worker_id,
        rating,
        comment,
        date: new Date().toISOString().slice(0, 10)
      }
    ]);

  if (error) {
    return res.status(400).json(error);
  }
  res.json(data);
};
