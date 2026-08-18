const run = async () => {
   const resp = await fetch("http://localhost:5000/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         customer_id: "6a00414a1e2de98227f6930c",
         customer_name: "Audit Verification Flow",
         worker_id: "6a00414b1e2de98227f6930f", // NAIDU ID
         date: "2026-05-11",
         time: "9 AM",
         service: "Electrical",
         price: 450,
         address: "Verification HQ",
         status: "Pending"
      })
   });
   console.log("STATUS CODE:", resp.status);
   console.log("RESPONSE:", await resp.text());
};
run();
