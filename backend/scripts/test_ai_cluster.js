const run = async () => {
   // 1. Inject dynamic worker in "Kovvur" (which is in Rajahmundry cluster)
   const createResp = await fetch("http://localhost:5000/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
         name: "Kovvur Sub Station Test",
         email: "kovvur@workers.com",
         service: "Electrical",
         city: "Kovvur",
         location: "Kovvur Sub",
         rating: 4.4,
         price: 300
      })
   });
   
   console.log("Worker creation status:", createResp.status);

   // 2. Query the server specifically for "Rajahmundry"!
   const queryResp = await fetch("http://localhost:5000/api/workers?city=rajahmundry");
   const data = await queryResp.json();
   
   // 3. Verify that "Kovvur" worker WAS retrieved successfully!
   const found = data.find(w => w.name === "Kovvur Sub Station Test");
   console.log("SUCCESS!! Found neighboring Kovvur worker during Rajahmundry query?", !!found);
   if (found) console.log("RETRIEVED NODE:", JSON.stringify(found, null, 2));
};
run();
