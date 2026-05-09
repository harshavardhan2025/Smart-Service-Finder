import { supabase } from "./config/supabase.js";

const workersData = [
  { name: "Rahul Sharma", service: "Carpentry", rating: 4.8, reviews: 45, city: "Kakinada", status: "Active" },
  { name: "Suresh Patil", service: "Carpentry", rating: 4.6, reviews: 28, city: "Rajahmundry", status: "Active" },
  { name: "Vijay Kumar", service: "Plumbing", rating: 4.8, reviews: 52, city: "Kakinada", status: "Active" },
  { name: "Deepak Rao", service: "Plumbing", rating: 4.4, reviews: 19, city: "Rajahmundry", status: "Blocked" },
  { name: "Ajay Devgn", service: "Electrical", rating: 4.6, reviews: 33, city: "Kakinada", status: "Active" },
  { name: "Kavya Murthy", service: "Electrical", rating: 4.9, reviews: 64, city: "Rajahmundry", status: "Active" },
  { name: "Glam Makeup Artistry", service: "Makeup", rating: 4.9, reviews: 41, city: "Kakinada", status: "Active" },
  { name: "Elegant Brides Makeup", service: "Makeup", rating: 4.8, reviews: 30, city: "Rajahmundry", status: "Active" },
  { name: "Express Bike Wash", service: "Bike Wash", rating: 4.5, reviews: 12, city: "Kakinada", status: "Active" },
  { name: "Pro Car Spa Wash", service: "Car Wash", rating: 4.8, reviews: 56, city: "Rajahmundry", status: "Active" },
  { name: "Cooling AC Repairers", service: "AC Repair", rating: 4.8, reviews: 88, city: "Kakinada", status: "Active" },
  { name: "Sparkle Floor Experts", service: "Floor cleaning", rating: 4.7, reviews: 34, city: "Rajahmundry", status: "Active" }
];

const bookingsData = [
  { customer_id: "CUST1", worker_id: 1, service: "Carpentry", date: "2026-05-10", time: "10:00 AM", amount: 850, status: "Upcoming" },
  { customer_id: "CUST1", worker_id: 3, service: "Plumbing", date: "2026-05-08", time: "2:00 PM", amount: 600, status: "Completed" },
  { customer_id: "CUST2", worker_id: 6, service: "Electrical", date: "2026-05-07", time: "11:00 AM", amount: 400, status: "Completed" }
];

const reviewsData = [
  { booking_id: 2, customer_name: "Harsha Vardhan", worker_id: 3, rating: 5, comment: "Excellent plumbing work!", date: "2026-05-08" },
  { booking_id: 3, customer_name: "Amit Khanna", worker_id: 6, rating: 4, comment: "Good electrical service.", date: "2026-05-07" }
];

const complaintsData = [
  { booking_id: 1, customer_name: "Sanjay Dutt", worker_id: 4, description: "Worker arrived late without notification.", status: "Resolved", date: "2026-05-01" }
];

async function seedDatabase() {
  console.log("Seeding Supabase Database...");

  // Insert Workers
  const { error: workersError } = await supabase.from("workers").insert(workersData);
  if (workersError) console.error("Error inserting workers:", workersError.message);
  else console.log("Workers seeded successfully!");

  // Insert Bookings
  const { error: bookingsError } = await supabase.from("bookings").insert(bookingsData);
  if (bookingsError) console.error("Error inserting bookings:", bookingsError.message);
  else console.log("Bookings seeded successfully!");

  // Insert Reviews
  const { error: reviewsError } = await supabase.from("reviews").insert(reviewsData);
  if (reviewsError) console.error("Error inserting reviews:", reviewsError.message);
  else console.log("Reviews seeded successfully!");

  // Insert Complaints
  const { error: complaintsError } = await supabase.from("complaints").insert(complaintsData);
  if (complaintsError) console.error("Error inserting complaints:", complaintsError.message);
  else console.log("Complaints seeded successfully!");

  console.log("Database seeding process finished.");
}

seedDatabase();
