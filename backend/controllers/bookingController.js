import { supabase }
from "../config/supabase.js";

export const createBooking =
async (req, res) => {

  const { customer_id, worker_id }
    = req.body;

  const { data, error } =
    await supabase
      .from("bookings")
      .insert([
        {
          customer_id,
          worker_id,
        },
      ]);

  if (error) {
    return res.status(400).json(error);
  }

  res.json(data);
};
