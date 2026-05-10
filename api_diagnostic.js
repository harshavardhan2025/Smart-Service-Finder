// Using native global fetch available in Node 18+

async function testRegistration() {
  try {
    console.log("🚀 STARTING DIRECT API DIAGNOSTIC TEST...");
    const testEmail = `diag_test_${Date.now()}@test.com`;
    
    const response = await fetch("http://127.0.0.1:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Diagnostic User",
        email: testEmail,
        password: "Password@123",
        phone: "9898989898",
        role: "user",
        city: "Mumbai"
      })
    });

    const data = await response.json();
    console.log("📡 STATUS CODE:", response.status);
    console.log("📦 RESPONSE BODY:", data);
    
    if (response.ok && data.success) {
       console.log("✅ API IS PERFECTLY OPERATIONAL AND CONNECTED TO MONGO ATLAS!");
    } else {
       console.log("❌ API FAILED DIAGNOSTICS CHECK.");
    }
  } catch (err) {
    console.error("💥 NETWORK ERROR:", err.message);
  }
}

testRegistration();
