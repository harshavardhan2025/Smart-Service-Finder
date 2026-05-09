import { supabase }
from "../config/supabase.js";

export const getWorkers =
async (req, res) => {

  const { data, error } =
    await supabase
      .from("workers")
      .select("*");

  if (error) {
    return res.status(400).json(error);
  }

  res.json(data);
};
