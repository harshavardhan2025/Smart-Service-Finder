const testQuery = async (query) => {
  console.log(`\n--------------------------------------`);
  console.log(`Sending Query: "${query}"`);
  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are the Workzy AI Assistant. The user is currently located near: Kakinada." },
          { role: "user", content: query }
        ]
      })
    });
    
    console.log(`HTTP Status: ${response.status}`);
    const data = await response.json();
    console.log(`Resolved Category: ${data.category}`);
    console.log(`AI Response: ${data.choices[0]?.message?.content}`);
    console.log(`Matched Workers:`, data.workers?.map(w => `${w.name} (${w.service} - ${w.city})`));
  } catch (err) {
    console.error(`Error querying chat API:`, err.message);
  }
};

const run = async () => {
  // Test spelling errors requested by the user
  await testQuery("need a pluber");
  await testQuery("ac is not coolng");
  await testQuery("electrican wire spark");
  await testQuery("doctr for fever");
  
  // Test general chitchat questions (should answer with AI/rules, not generic dummy block)
  await testQuery("how to book a service?");
  await testQuery("what payment methods do you support?");
  await testQuery("what is your name?");
};

run();
