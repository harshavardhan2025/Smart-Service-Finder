import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

console.log("URL:", process.env.SUPABASE_URL);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function test() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: "testfetch@gmail.com",
      password: "Password123!"
    });
    console.log("Data:", data);
    console.log("Error:", error);
  } catch (err) {
    console.error("Catch:", err);
  }
}
test();
