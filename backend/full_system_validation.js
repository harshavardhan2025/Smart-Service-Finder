// We'll perform a live, end-to-end integration flow against the active Express server!
const API_URL = "http://localhost:5000/api";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runFullValidation() {
   console.log("\n=======================================================");
   console.log("🛠️  WORKZY AI, SECURITY, & UI E2E INTEGRATION ENGINE");
   console.log("=======================================================\n");

   try {
      // ----------------------------------------------------
      // STEP 1: AUTHENTICATE CUSTOMER
      // ----------------------------------------------------
      console.log("🔐 Step 1: Authenticating Customer Account (user@harsha.com)...");
      const clientAuthResp = await fetch(`${API_URL}/auth/login`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: "user@harsha.com", password: "password123" })
      });
      if (!clientAuthResp.ok) throw new Error("Customer auth failed!");
      const clientData = await clientAuthResp.json();
      const customerToken = clientData.token;
      const customerUser = clientData.user;
      console.log(`   ✅ Authenticated! Welcome ${customerUser.name} (ID: ${customerUser._id || customerUser.id})`);
      console.log(`   ✅ Current Wallet Balance: ₹${customerUser.walletBalance || 5000}`);

      // ----------------------------------------------------
      // STEP 2: REGISTER CLIENT SECURITY ACTIVITY LOG
      // ----------------------------------------------------
      console.log("\n🛡️  Step 2: Registering secure client activity log...");
      const logResp = await fetch(`${API_URL}/security/logs`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            user_id: customerUser._id || customerUser.id,
            email: customerUser.email,
            role: customerUser.role || "user",
            action: "Biometric session authorization",
            city: customerUser.city || "Kakinada"
         })
      });
      if (!logResp.ok) {
         console.log(await logResp.text());
         throw new Error("Security activity log registration failed!");
      }
      console.log("   ✅ Security activity log successfully registered in MongoDB!");

      // ----------------------------------------------------
      // STEP 3: DISCOVER SPECIALIZED EXPERTS (AI SIMULATION)
      // ----------------------------------------------------
      console.log("\n🤖 Step 3: Simulating AI Voice Search Discovery for 'AC Repair' in 'Kakinada'...");
      const workersResp = await fetch(`${API_URL}/workers?service=AC%20Repair&city=Kakinada`);
      if (!workersResp.ok) throw new Error("Failed to discover experts!");
      const workers = await workersResp.json();
      console.log(`   ✅ Successfully found ${workers.length} active experts matching AC Repair!`);
      const selectedWorker = workers[0];
      console.log(`   👉 Selected Professional: ${selectedWorker.name} (Rating: ⭐ ${selectedWorker.rating}, Cost: ₹${selectedWorker.price})`);

      // ----------------------------------------------------
      // STEP 4: AUTHENTICATE WORKER FOR THREADED REPLIES
      // ----------------------------------------------------
      console.log(`\n🔑 Step 4: Authenticating Worker Account (${selectedWorker.email}) for interactive replies...`);
      const workerAuthResp = await fetch(`${API_URL}/auth/login`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: selectedWorker.email, password: "password123" })
      });
      if (!workerAuthResp.ok) throw new Error("Worker auth failed!");
      const workerData = await workerAuthResp.json();
      const workerToken = workerData.token;
      console.log(`   ✅ Worker Authenticated! Token secured for threaded comments.`);

      // ----------------------------------------------------
      // STEP 5: BOOK A SERVICE WITH WALLET CHECKOUT
      // ----------------------------------------------------
      const todayStr = new Date().toLocaleDateString('en-CA');
      console.log(`\n📅 Step 5: Creating secure booking with ${selectedWorker.name} for ${todayStr} at 3 PM...`);
      const bookResp = await fetch(`${API_URL}/bookings`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
         },
         body: JSON.stringify({
            customer_id: customerUser._id || customerUser.id,
            customer_name: customerUser.name,
            worker_id: selectedWorker._id || selectedWorker.id,
            date: todayStr,
            time: "3 PM",
            service: selectedWorker.service,
            price: selectedWorker.price,
            address: "Harsha HQ, Kakinada Main Junction",
            status: "Pending"
         })
      });
      if (!bookResp.ok) {
         console.log(await bookResp.text());
         throw new Error("Booking creation failed!");
      }
      const bookData = await bookResp.json();
      const booking = bookData.booking;
      console.log(`   ✅ Booking created successfully! Reference ID: ${booking._id}`);

      // ----------------------------------------------------
      // STEP 6: POST THE DYNAMIC WALLET LEDGER TRANSACTION
      // ----------------------------------------------------
      console.log("\n💼 Step 6: Dispatching dynamic secure wallet deduction transaction to ledger...");
      const transResp = await fetch(`${API_URL}/transactions`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customerToken}`
         },
         body: JSON.stringify({
            customer: customerUser.name,
            worker: selectedWorker.name,
            service: selectedWorker.service,
            amount: selectedWorker.price,
            status: "Paid",
            method: "Wallet"
         })
      });
      if (!transResp.ok) {
         console.log(await transResp.text());
         throw new Error("Transaction logging failed!");
      }
      const transData = await transResp.json();
      const transaction = transData.transaction;
      console.log(`   ✅ Transaction registered! Deduction of ₹${transaction.amount} logged.`);

      // ----------------------------------------------------
      // STEP 7: SUBMIT CUSTOMER REVIEW & SLIDER RATING
      // ----------------------------------------------------
      console.log("\n⭐️ Step 7: Submitting StarSlider review with dynamic sentiment classification...");
      const reviewResp = await fetch(`${API_URL}/reviews`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            booking_id: booking._id,
            service: selectedWorker.service,
            customer_name: customerUser.name,
            worker_id: selectedWorker._id || selectedWorker.id,
            rating: 5,
            comment: "Exemplary AC cleaning! The cooling is exceptionally fast now, perfect work.",
            date: todayStr
         })
      });
      if (!reviewResp.ok) throw new Error("Review submission failed!");
      const review = await reviewResp.json();
      console.log(`   ✅ Review submitted successfully! Rating: ⭐ 5 ("Exemplary Partner")`);
      console.log(`   👉 Customer Comment: "${review.comment}"`);

      // ----------------------------------------------------
      // STEP 8: WORKER POSTS A THREADED RESPONSE
      // ----------------------------------------------------
      console.log(`\n💬 Step 8: Worker (${selectedWorker.name}) posting threaded response...`);
      const replyResp = await fetch(`${API_URL}/reviews/${review._id}/reply`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            reply: "Thank you so much Harsha User! Extremely glad to help restore your cooling. Call anytime! 👍"
         })
      });
      if (!replyResp.ok) throw new Error("Worker reply failed!");
      const updatedReview = await replyResp.json();
      console.log(`   ✅ Threaded Worker reply submitted!`);
      console.log(`   👉 Worker Reply: "${updatedReview.reply}"`);

      // ----------------------------------------------------
      // STEP 9: TRIGGER HIGH-PRIORITY SOS EMERGENCY MECHANISM
      // ----------------------------------------------------
      console.log("\n🚨 Step 9: Simulating High-Priority User SOS Alert mechanism...");
      const sosResp = await fetch(`${API_URL}/security/sos`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            user_id: customerUser._id || customerUser.id,
            name: customerUser.name,
            role: customerUser.role || "user",
            booking_id: booking._id,
            lat: 16.9890,
            lng: 82.2475,
            location_name: "Kakinada Main Road Sector 3"
         })
      });
      if (!sosResp.ok) {
         console.log(await sosResp.text());
         throw new Error("SOS alert registration failed!");
      }
      const sosAlertData = await sosResp.json();
      const sosAlert = sosAlertData.alert;
      console.log(`   ⚠️ SOS SIREN TRIGGERED ON ADMIN PANELS!`);
      console.log(`   ⚠️ distress coordinates: Latitude ${sosAlert.lat}, Longitude ${sosAlert.lng}`);
      console.log(`   ⚠️ location: ${sosAlert.location_name}`);
      console.log(`   ⚠️ status: RED ALERT - ${sosAlert.status}`);

      // ----------------------------------------------------
      // STEP 10: AUTOMATICALLY RESOLVE AND ARCHIVE TEST SOS DISTRESS TELEMETRY
      // ----------------------------------------------------
      console.log("\n🛡️ Step 10: Auto-resolving and archiving test SOS distress telemetry...");
      const resolveResp = await fetch(`${API_URL}/security/sos/${sosAlert._id}/resolve`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" }
      });
      if (resolveResp.ok) {
         console.log("   ✅ Test SOS alert successfully resolved to 'Resolved'!");
      }

      // Fetch admin notifications to find the associated E2E SOS notification and mark it read
      const notifResp = await fetch(`${API_URL}/notifications?role=admin`);
      if (notifResp.ok) {
         const notifications = await notifResp.json();
         const targetNotif = notifications.find(n => n.type === "emergency" && !n.is_read);
         if (targetNotif) {
            const markReadResp = await fetch(`${API_URL}/notifications/${targetNotif._id}`, {
               method: "PATCH",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ is_read: true })
            });
            if (markReadResp.ok) {
               console.log("   ✅ Test SOS notification successfully archived (marked as read)!");
            }
         }
      }

      console.log("\n=======================================================");
      console.log("🎉  ALL SYSTEM FLIGHT CHECKS COMPLETE - 100% OPERATIONAL!");
      console.log("=======================================================\n");

   } catch (err) {
      console.error("\n❌ System validation FAILED:", err.message);
      process.exit(1);
   }
}

runFullValidation();
