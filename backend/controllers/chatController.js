import Worker from "../models/Worker.js";

// 🚀 HIGH-PERFORMANCE IN-MEMORY SEMANTIC NLP ENGINE
// Fallback that cleanly processes user queries, detects category/city intents,
// and crafts realistic, friendly conversational responses with emojis.
const localAIEngine = (userQuery, userLocation) => {
  const query = userQuery.toLowerCase().trim();
  
  // 1. Precise platform service category matching
  let matchedService = null;
  const servicesList = [
    { name: "Plumbing", keywords: ["plumber", "leak", "pipe", "tap", "sink", "toilet", "drain", "water line"] },
    { name: "Electrical", keywords: ["electrician", "wire", "switch", "fuse", "fan", "light", "current", "power", "short circuit"] },
    { name: "Carpentry", keywords: ["carpenter", "wood", "door", "chair", "sofa", "furniture", "table", "wooden"] },
    { name: "AC Repair", keywords: ["ac", "air conditioner", "cooling", "cool", "condenser", "compressor"] },
    { name: "Washing Machine", keywords: ["washing machine", "washer", "dryer", "laundry"] },
    { name: "Geyser", keywords: ["geyser", "heater", "hot water"] },
    { name: "Grinder", keywords: ["grinder"] },
    { name: "Mixer", keywords: ["mixer", "juicer", "blender"] },
    { name: "Refrigerator", keywords: ["fridge", "refrigerator", "freezer"] },
    { name: "Water Purifier", keywords: ["purifier", "filter", "ro"] },
    { name: "House Cleaning", keywords: ["cleaning", "clean", "maid", "sweep", "house clean", "deep clean"] },
    { name: "Floor cleaning", keywords: ["floor clean", "mop", "scrub"] },
    { name: "Utensils Cleaning", keywords: ["utensil", "dish", "plate", "pot"] },
    { name: "Wall Putty Coating", keywords: ["putty", "coating", "wall putty"] },
    { name: "Interior Painting", keywords: ["paint", "interior", "indoor paint", "room paint"] },
    { name: "Exterior Painting", keywords: ["exterior paint", "outdoor paint", "building paint"] },
    { name: "Texture & Designer Finishers", keywords: ["texture", "designer finish", "wall art"] },
    { name: "Wallpaper Installation", keywords: ["wallpaper", "wall paper", "wall sticker"] },
    { name: "Wood Polishing", keywords: ["wood polish", "polish", "varnish"] },
    { name: "Two-Wheeler (Bikes)", keywords: ["bike", "motorcycle", "scooter", "two-wheeler", "puncture"] },
    { name: "Four-Wheeler (Cars)", keywords: ["car", "automobile", "mechanic", "four-wheeler"] },
    { name: "Others (Heavy)", keywords: ["tractor", "crane", "heavy mech"] },
    { name: "Bike Wash", keywords: ["bike wash", "scooter wash"] },
    { name: "Car Wash", keywords: ["car wash", "car vacuum"] },
    { name: "Photography", keywords: ["photo", "video", "shoot", "camera", "wedding shoot"] },
    { name: "Purohit", keywords: ["priest", "pandit", "pooja", "purohit", "havan"] },
    { name: "Decor", keywords: ["decor", "balloon", "flower decoration", "stage"] },
    { name: "Mehandi", keywords: ["mehandi", "henna"] },
    { name: "Makeup", keywords: ["makeup", "bridal makeup"] },
    { name: "Beauty, Salon & Spa", keywords: ["salon", "parlor", "beauty", "haircut", "facial", "spa", "nail"] },
    { name: "Doctors", keywords: ["doctor", "medical", "consultation", "physician", "clinic", "sick", "health", "ill", "fever", "pain", "injury", "medicine", "cough", "cold", "flu", "hospital", "patient"] }
  ];

  for (const s of servicesList) {
    if (s.keywords.some(k => query.includes(k))) {
      matchedService = s.name;
      break;
    }
  }

  // 2. City extraction
  let matchedCity = null;
  const cities = ["kakinada", "rajahmundry", "new delhi", "delhi", "hyderabad"];
  for (const c of cities) {
    if (query.includes(c)) {
      matchedCity = c === "delhi" ? "New Delhi" : c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // 3. Conversational Response Generation
  let aiResponse = "";
  let workerSearch = false;

  if (matchedService) {
    workerSearch = true;
    const targetCity = matchedCity || userLocation.split(",")[0].trim();
    aiResponse = `I would be glad to help you find the best expert for **${matchedService}** in ${targetCity}! 🛠️✨ Here are the top-rated professionals matched from our database.`;
  } else if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("welcome")) {
    aiResponse = "Hello! 👋 Welcome to Workzy! I am your personal AI Assistant. How can I help make your life easier today? You can describe any issue (e.g. 'AC not cooling', 'leak', 'car wash') and I will find the right local experts! 🤖✨";
  } else if (query.includes("price") || query.includes("cost") || query.includes("charge")) {
    aiResponse = "Pricing is dynamic and depends on the specific professional you choose! 💰 Basic visits start at ₹150, and rates are listed transparently on each worker's profile.";
  } else if (query.includes("discount") || query.includes("offer") || query.includes("coupon") || query.includes("promo")) {
    aiResponse = "Yes! 🎁 We have awesome promo coupons running (like **DOCFREE** for flat ₹150 off or **FESTIVE25** for 25% off). Apply them at checkout to save!";
  } else if (query.includes("plan") || query.includes("subscribe")) {
    aiResponse = "We offer premium annual packages (like our **Unlimited Annual Car Wash** or **Doctors Annual Family Plan**)! 💎 Check out the 'Plans & Offers' page to subscribe!";
  } else if (query.includes("safety") || query.includes("safe") || query.includes("verify")) {
    aiResponse = "Your safety is our top priority! 🛡️ Every service provider on Workzy undergoes rigorous background checks and government ID verifications.";
  } else if (query.includes("thank") || query.includes("thanks")) {
    aiResponse = "You are so very welcome! ❤️ I'm always here to assist. Let me know if you need to find any other local professionals!";
  } else if (query.includes("bye") || query.includes("goodbye") || query.includes("night")) {
    aiResponse = "Goodbye! 👋 Have a peaceful time, and don't hesitate to chat with me again if you need any service assistance! 🤖";
  } else {
    aiResponse = "I'm analyzing your request! 🤖 Please mention a service you need (like AC repair, plumbing, carpentry, or bridal makeup) and I will instantly search the database for you!";
  }

  return { workerSearch, service: matchedService, city: matchedCity, aiResponse };
};

export const proxyChat = async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = process.env.AI_API_KEY || "";

    // Extract user query and detected location from system context
    const userQuery = messages[messages.length - 1]?.content || "";
    const systemMsg = messages.find(m => m.role === "system")?.content || "";
    
    // Simple regex extraction of user location from system prompt
    let userLocation = "Kakinada";
    const locMatch = systemMsg.match(/located near:\s*([^.]+)/i);
    if (locMatch) {
      userLocation = locMatch[1].trim();
    }

    let parsedResult = null;
    let rawResponseText = "";

    // 🛡️ DUAL-ENGINE STRATEGY: Attempt remote LLM first, gracefully fall back to local AI on error/auth failure
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const systemPrompt = `You are a structured classification and conversational AI for the Workzy home service platform.
Analyze the user's message. The user's current detected location is: "${userLocation}".

We have the following services on our platform:
- "Plumbing", "Electrical", "Carpentry", "AC Repair", "Washing Machine", "Geyser", "Grinder", "Mixer", "Refrigerator", "Water Purifier", "House Cleaning", "Floor cleaning", "Utensils Cleaning", "Wall Putty Coating", "Interior Painting", "Exterior Painting", "Texture & Designer Finishers", "Wallpaper Installation", "Wood Polishing", "Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)", "Bike Wash", "Car Wash", "Photography", "Purohit", "Decor", "Mehandi", "Makeup", "Beauty, Salon & Spa", "Doctors"

You must reply with ONLY a valid JSON object matching the following keys:
1. "workerSearch": boolean (true if looking to book/find a worker, false for general talk).
2. "service": string (one of the platform services listed above if workerSearch is true, otherwise null).
3. "city": string (city name if mentioned, e.g. "Kakinada", "New Delhi", or null).
4. "aiResponse": string (friendly response, use emojis, mention plans/offers if relevant. Max 2 sentences).

Do not include any markdown formatting, no \`\`\`json wrappers. Respond with ONLY the raw JSON.`;

        const apiUrl = process.env.AI_API_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions";
        const modelName = process.env.AI_MODEL_NAME || "glm-3-turbo";

        console.log(`🛰️ [AI LIVE QUERY] Querying LLM API at ${apiUrl} using model ${modelName}...`);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ],
            temperature: 0.1
          }),
          signal: AbortSignal.timeout(3000) // ⚡ 3 second limit: never freeze the UI!
        });

        const data = await response.json();
        console.log("🛰️ [ZHIPU AI API RESPONSE]:", JSON.stringify(data, null, 2));

        if (response.ok) {
          if (data.choices && data.choices.length > 0) {
            rawResponseText = data.choices[0].message.content;
            try {
              const cleaned = rawResponseText.replace(/```json/gi, "").replace(/```/g, "").trim();
              parsedResult = JSON.parse(cleaned);
            } catch (err) {
              console.warn("JSON parse fail from Zhipu:", err.message);
            }
          } else if (data.error) {
            console.warn("Zhipu AI returned API Error:", data.error.message);
          }
        } else {
          console.warn(`Zhipu AI endpoint returned HTTP ${response.status}`);
        }
      } catch (netError) {
        console.warn("Zhipu AI Connection Timeout or Network Failure:", netError.message);
      }
    }

    // 🧠 ACTIVATE DUAL-ENGINE FALLBACK
    // If remote LLM failed, was unauthorized, timed out, or returned empty - serve from local NLP
    if (!parsedResult) {
      console.log("🚀 [DUAL-ENGINE] Serving high-performance in-memory local AI response for:", userQuery);
      parsedResult = localAIEngine(userQuery, userLocation);
    }

    let workers = [];
    let matchedCategory = parsedResult.service;

    // If AI identified a service lookup request, query database dynamically
    if (parsedResult.workerSearch && matchedCategory) {
      const searchCity = parsedResult.city || userLocation.split(",")[0].trim();
      
      const filter = {
        service: new RegExp(matchedCategory, "i"),
        status: "Active"
      };

      if (searchCity && !searchCity.toLowerCase().includes("unknown")) {
        filter.city = new RegExp(searchCity, "i");
      }

      workers = await Worker.find(filter).sort({ rating: -1 }).limit(3).lean();
    }

    // Return exact payload expected by frontend, including the conversational reply and found workers
    res.status(200).json({
      choices: [
        {
          message: {
            content: parsedResult.aiResponse || rawResponseText
          }
        }
      ],
      workers: workers,
      category: matchedCategory
    });

  } catch (error) {
    console.error("Backend AI proxy breakdown:", error.message);
    res.status(500).json({ error: "Internal AI Relay Failure" });
  }
};
