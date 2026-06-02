import crypto from "crypto";
import Worker from "../models/Worker.js";

// Levenshtein distance algorithm for robust character-level spelling correction
const levenshtein = (a, b) => {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
};

// Mathematically optimized search matching engine using scaled Levenshtein distances and stop-words filters
const findBestServiceMatch = (queryText) => {
  const stopWords = new Set([
    "need", "want", "have", "with", "this", "that", "your", "from", "near", "best", "some", "good", "find", "show", "here", "there", 
    "what", "where", "when", "about", "book", "free", "how", "to", "do", "you", "a", "an", "the", "is", "are", "was", "were", 
    "payment", "methods", "support", "service", "booking", "cancel", "reschedule", "refund", "price", "discount", "offers", 
    "safety", "verified", "time", "hours", "location", "cities", "help", "complaint"
  ]);

  const words = queryText.toLowerCase().split(/[\s,./?#@!$%^&*()_+={}[\]|\\:;"'-]+/);
  let bestService = null;
  let minDistance = Infinity;

  const servicesList = [
    { name: "Plumbing", keywords: ["plumber", "pluber", "leak", "pipe", "tap", "sink", "toilet", "drain", "water line"] },
    { name: "Electrical", keywords: ["electrician", "electrican", "wire", "switch", "fuse", "fan", "light", "current", "power", "short circuit", "spark"] },
    { name: "Carpentry", keywords: ["carpenter", "wood", "door", "chair", "sofa", "furniture", "table", "wooden"] },
    { name: "AC Repair", keywords: ["ac", "air conditioner", "cooling", "coolng", "cool", "condenser", "compressor"] },
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
    { name: "Beauty, Salon & Spa", keywords: ["salon", "parlor", "beauty", "haircut", "facial", "spa", "nail", "grooming", "shave", "beard"] },
    { name: "Doctors", keywords: ["doctor", "doctr", "medical", "consultation", "physician", "clinic", "sick", "health", "ill", "fever", "pain", "injury", "medicine", "cough", "cold", "flu", "hospital", "patient"] }
  ];

  for (const w of words) {
    if (w.length < 3 || stopWords.has(w)) continue;

    for (const service of servicesList) {
      for (const keyword of service.keywords) {
        if (w === keyword) {
          bestService = service.name;
          minDistance = 0;
          break;
        }
        if (w.includes(keyword) || keyword.includes(w)) {
          const distance = Math.abs(w.length - keyword.length);
          if (distance < minDistance) {
            minDistance = distance;
            bestService = service.name;
          }
        }
        
        const minLen = Math.min(w.length, keyword.length);
        const allowedDistance = minLen <= 3 ? 0 : minLen === 4 ? 1 : 2;
        const dist = levenshtein(w, keyword);
        
        if (dist <= allowedDistance && dist < minDistance) {
          minDistance = dist;
          bestService = service.name;
        }
      }
    }
  }

  return bestService;
};

// Legacy stub fallback wrapper
const hasFuzzyWordMatch = (queryText, targetWord) => {
  return findBestServiceMatch(queryText) === targetWord;
};

// Normalize spelling errors, synonyms, symptoms, and specific words to database services
export const normalizeServiceCategory = (category) => {
  if (!category) return null;
  const clean = category.toLowerCase().trim();
  
  if (clean.includes("plumb") || clean.includes("pluber") || clean.includes("leak") || clean.includes("pipe") || clean.includes("tap") || clean.includes("sink") || clean.includes("toilet") || clean.includes("drain")) return "Plumbing";
  if (clean.includes("electr") || clean.includes("wire") || clean.includes("switch") || clean.includes("fan") || clean.includes("light") || clean.includes("power") || clean.includes("current") || clean.includes("fuse") || clean.includes("spark")) return "Electrical";
  if (clean.includes("carpen") || clean.includes("wood") || clean.includes("furniture") || clean.includes("door") || clean.includes("chair") || clean.includes("table")) return "Carpentry";
  if (clean.includes("ac") || clean.includes("air cond") || clean.includes("cooling") || clean.includes("coolng") || clean.includes("cooler") || clean.includes("condenser")) return "AC Repair";
  if (clean.includes("wash") && (clean.includes("machine") || clean.includes("laundry") || clean.includes("dryer") || clean.includes("washer"))) return "Washing Machine";
  if (clean.includes("geyser") || clean.includes("heater") || clean.includes("hot water")) return "Geyser";
  if (clean.includes("grinder")) return "Grinder";
  if (clean.includes("mixer") || clean.includes("blender") || clean.includes("juicer")) return "Mixer";
  if (clean.includes("fridge") || clean.includes("refrigerator") || clean.includes("freezer")) return "Refrigerator";
  if (clean.includes("purifier") || clean.includes("ro filter") || clean.includes("water filter")) return "Water Purifier";
  if (clean.includes("deep") || (clean.includes("house") && clean.includes("clean")) || clean.includes("maid") || clean.includes("home clean")) return "House Cleaning";
  if (clean.includes("floor") && clean.includes("clean")) return "Floor cleaning";
  if (clean.includes("utensil") || clean.includes("dish") || clean.includes("plate") || clean.includes("pot")) return "Utensils Cleaning";
  if (clean.includes("putty") || clean.includes("coating")) return "Wall Putty Coating";
  if (clean.includes("interior") || (clean.includes("paint") && !clean.includes("exterior") && !clean.includes("wood") && !clean.includes("wallpaper"))) return "Interior Painting";
  if (clean.includes("exterior") || clean.includes("outdoor paint") || clean.includes("building paint")) return "Exterior Painting";
  if (clean.includes("texture") || clean.includes("designer finish")) return "Texture & Designer Finishers";
  if (clean.includes("wallpaper") || clean.includes("wall sticker")) return "Wallpaper Installation";
  if (clean.includes("wood polish") || clean.includes("varnish") || clean.includes("polishing")) return "Wood Polishing";
  if (clean.includes("bike") && (clean.includes("repair") || clean.includes("mechanic") || clean.includes("two-wheeler") || clean.includes("motorcycle"))) return "Two-Wheeler (Bikes)";
  if (clean.includes("car") && (clean.includes("repair") || clean.includes("mechanic") || clean.includes("four-wheeler") || clean.includes("sedan") || clean.includes("suv"))) return "Four-Wheeler (Cars)";
  if (clean.includes("tractor") || clean.includes("crane") || clean.includes("heavy")) return "Others (Heavy)";
  if (clean.includes("bike") && clean.includes("wash")) return "Bike Wash";
  if (clean.includes("car") && clean.includes("wash")) return "Car Wash";
  if (clean.includes("photo") || clean.includes("video") || clean.includes("camera") || clean.includes("shoot")) return "Photography";
  if (clean.includes("priest") || clean.includes("pandit") || clean.includes("pooja") || clean.includes("purohit") || clean.includes("havan")) return "Purohit";
  if (clean.includes("decor") || clean.includes("balloon") || clean.includes("flower")) return "Decor";
  if (clean.includes("mehandi") || clean.includes("henna")) return "Mehandi";
  if (clean.includes("makeup") || clean.includes("cosmetic")) return "Makeup";
  if (clean.includes("salon") || clean.includes("haircut") || clean.includes("facial") || clean.includes("parlor") || clean.includes("beauty") || clean.includes("spa") || clean.includes("nail") || clean.includes("grooming") || clean.includes("shave") || clean.includes("beard")) return "Beauty, Salon & Spa";
  if (clean.includes("doctor") || clean.includes("medical") || clean.includes("physician") || clean.includes("sick") || clean.includes("health") || clean.includes("hospital") || clean.includes("clinic") || clean.includes("doctr") || clean.includes("fever") || clean.includes("pain") || clean.includes("cough") || clean.includes("cold")) return "Doctors";

  // Exact matching fallback checks
  const services = ["Plumbing", "Electrical", "Carpentry", "AC Repair", "Washing Machine", "Geyser", "Grinder", "Mixer", "Refrigerator", "Water Purifier", "House Cleaning", "Floor cleaning", "Utensils Cleaning", "Wall Putty Coating", "Interior Painting", "Exterior Painting", "Texture & Designer Finishers", "Wallpaper Installation", "Wood Polishing", "Two-Wheeler (Bikes)", "Four-Wheeler (Cars)", "Others (Heavy)", "Bike Wash", "Car Wash", "Photography", "Purohit", "Decor", "Mehandi", "Makeup", "Beauty, Salon & Spa", "Doctors"];
  for (const s of services) {
    if (s.toLowerCase().includes(clean) || clean.includes(s.toLowerCase())) {
      return s;
    }
  }

  return category;
};

// Zhipu JWT signature builder for standard completions
const generateZhipuToken = (apiKey) => {
  if (!apiKey || !apiKey.includes(".")) return "";
  const [id, secret] = apiKey.split(".");
  const timestamp = Date.now();
  const exp = timestamp + 180000; // 3 minutes validity in ms
  
  const header = {
    alg: "HS256",
    sign_type: "SIGN"
  };
  const payload = {
    api_key: id,
    exp: exp,
    timestamp: timestamp
  };
  
  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };
  
  const headerPart = base64UrlEncode(header);
  const payloadPart = base64UrlEncode(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
    
  return `${headerPart}.${payloadPart}.${signature}`;
};

// Fallback in-memory NLP engine utilizing fuzzy matching and a rich guide database
const localAIEngine = (userQuery, userLocation) => {
  const query = userQuery.toLowerCase().trim();
  
  // 1. Precise platform service category matching using Levenshtein fuzzy word checks
  let matchedService = findBestServiceMatch(query);

  // 2. City extraction
  let matchedCity = null;
  const cities = ["kakinada", "rajahmundry", "new delhi", "delhi", "hyderabad", "mumbai"];
  for (const c of cities) {
    if (hasFuzzyWordMatch(query, c)) {
      matchedCity = c === "delhi" ? "New Delhi" : c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // 3. Complete guide, support & chitchat database to answer ANYTHING dynamically
  let aiResponse = "";
  let workerSearch = false;

  if (matchedService) {
    workerSearch = true;
    const targetCity = matchedCity || userLocation.split(",")[0].trim();
    aiResponse = `I would be glad to help you find the best expert for **${matchedService}** in ${targetCity}! 🛠️✨ Here are the top-rated professionals matched from our database.`;
  } else if (query.includes("how to book") || query.includes("booking") || query.includes("how do i book")) {
    aiResponse = "To book a service:\n1. Open the homepage.\n2. Tap on any main category (like Painting, Events, Beauty) to view its sub-services.\n3. Click on your desired sub-service (e.g. AC Repair, Makeup).\n4. Select a nearby professional, click 'View Profile & Book', select your date and time slot, and confirm! 📅✨";
  } else if (query.includes("payment") || query.includes("refund") || query.includes("money")) {
    aiResponse = "We support multiple secure payment gateways including Google Pay / UPI, Secure Wallet, Credit/Debit Cards, and Cash on Delivery. To see your transaction statements, please head to your 'Profile' section! 💵🛡️";
  } else if (query.includes("complaint") || query.includes("support") || query.includes("issue") || query.includes("help")) {
    aiResponse = "I can record any feedback or complaints here. You can also head over to our support portal to generate an official complaint ticket, and our team will get in touch with you within 24 hours. ⚖️🤝";
  } else if (query.includes("price") || query.includes("cost") || query.includes("charge") || query.includes("rate") || query.includes("how much")) {
    aiResponse = "Pricing is dynamic and depends on the specific professional you choose! 💰 Basic visits start at ₹150, and rates are listed transparently on each worker's profile.";
  } else if (query.includes("discount") || query.includes("offer") || query.includes("coupon") || query.includes("promo")) {
    aiResponse = "Yes! 🎁 We have awesome promo coupons running (like **DOCFREE** for flat ₹150 off or **FESTIVE25** for 25% off). Apply them at checkout to save!";
  } else if (query.includes("plan") || query.includes("subscribe")) {
    aiResponse = "We offer premium annual packages (like our **Unlimited Annual Car Wash** or **Doctors Annual Family Plan**)! 💎 Check out the 'Plans & Offers' page to subscribe!";
  } else if (query.includes("safety") || query.includes("safe") || query.includes("verify") || query.includes("background check")) {
    aiResponse = "Your safety is our top priority! 🛡️ Every service provider on Workzy undergoes rigorous background checks and government ID verifications.";
  } else if (query.includes("time") || query.includes("hours") || query.includes("open") || query.includes("available")) {
    aiResponse = "Our professionals are typically active from 8:00 AM to 9:00 PM, 7 days a week. During checkout, you can select any available time slot that perfectly fits your schedule! 🕐✨";
  } else if (query.includes("where") || query.includes("city") || query.includes("cities") || query.includes("location") || query.includes("bangalore") || query.includes("mumbai") || query.includes("delhi")) {
    aiResponse = "We currently operate in major cities including Mumbai, Bangalore, Delhi, Chennai, and Hyderabad. The platform automatically detects your searched location to show you the nearest available experts! 🗺️📍";
  } else if (query.includes("how are you")) {
    aiResponse = "I'm doing absolutely fantastic, thank you for asking! 😊 I'm ready and excited to help you find the best home services today. How can I assist you today?";
  } else if (query.includes("who are you") || query.includes("your name") || query.includes("what are you")) {
    aiResponse = "I am your personal Workzy AI Assistant! 🤖✨ I specialize in helping you discover, select, and book the perfect local professionals for any task, from home repairs to event management.";
  } else if (query.includes("thank") || query.includes("thanks")) {
    aiResponse = "You are so very welcome! ❤️ I'm always here to assist. Let me know if you need to find any other local professionals!";
  } else if (query.includes("great") || query.includes("awesome") || query.includes("nice") || query.includes("cool")) {
    aiResponse = "Awesome! Glad to hear that. 👍 Let me know if you need to book any services today!";
  } else if (query.includes("good morning")) {
    aiResponse = "Good morning! ☀️ Wishing you a wonderful and productive day ahead. How can I assist you with your home services today?";
  } else if (query.includes("good evening")) {
    aiResponse = "Good evening! 🌆 Hope you had a great day. How can I help you relax or sort out your home chore needs tonight?";
  } else if (query.includes("good afternoon")) {
    aiResponse = "Good afternoon! 🌤️ Hope your day is going well. Need any quick service assistance?";
  } else if (query.includes("namaste") || query.includes("hello") || query.includes("hi") || query.includes("hey") || query.includes("welcome")) {
    aiResponse = "Hello there! 👋 Welcome to Workzy. It's wonderful to chat with you today.\n\nHow can I help make your life easier? (e.g., 'fix my leaking tap', 'need mehandi design', or 'house cleaning')";
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

    // 📍 DYNAMIC DATABASE-DRIVEN GEOLOCATION INTERCEPTOR
    if (
      userQuery.toLowerCase().includes("geolocation") ||
      userQuery.toLowerCase().includes("neighborhoods") ||
      userQuery.toLowerCase().includes("famous local areas") ||
      userQuery.toLowerCase().includes("nearby famous")
    ) {
      let searchCity = userLocation.split(",")[0].trim();
      const cityMatch = userQuery.match(/user is at\s*["']([^"']+)["']/i);
      if (cityMatch) {
        searchCity = cityMatch[1].split(",")[0].trim();
      }

      console.log(`🤖 [AI GEOLOCATION INTERCEPTOR] Extracting active worker neighborhoods from database for: "${searchCity}"...`);
      const activeWorkersInCity = await Worker.find({
        city: new RegExp(searchCity, "i"),
        status: "Active"
      }).select("location").lean();

      // Extract unique location neighborhoods (case-insensitive deduplication, ignoring the base city name)
      const seenLocs = new Set();
      const uniqueLocs = [];
      for (const w of activeWorkersInCity) {
        if (w.location) {
          const cleanLoc = w.location.trim();
          const lowerLoc = cleanLoc.toLowerCase();
          if (
            lowerLoc !== searchCity.toLowerCase() &&
            !seenLocs.has(lowerLoc)
          ) {
            seenLocs.add(lowerLoc);
            uniqueLocs.push(cleanLoc);
          }
        }
      }

      // Fallback pre-populated lists in case the database is empty for the target city
      let fallbackAreas = "Danavaipeta, Pushkar Ghat, Bommarillu";
      if (searchCity.toLowerCase().includes("kakinada")) {
        fallbackAreas = "Bhanugudi Junction, Jagannaickpur, Suryaraopeta";
      } else if (searchCity.toLowerCase().includes("delhi")) {
        fallbackAreas = "Connaught Place, Karol Bagh, Vasant Kunj";
      } else if (searchCity.toLowerCase().includes("hyderabad")) {
        fallbackAreas = "Gachibowli, Jubilee Hills, Madhapur";
      } else if (searchCity.toLowerCase().includes("mumbai")) {
        fallbackAreas = "Andheri, Bandra, Colaba";
      }

      const finalAreas = uniqueLocs.length >= 2 ? uniqueLocs.slice(0, 3).join(", ") : fallbackAreas;
      console.log(`🤖 [AI GEOLOCATION INTERCEPTOR] Resolved areas from database: "${finalAreas}"`);

      return res.status(200).json({
        choices: [
          {
            message: {
              content: finalAreas
            }
          }
        ],
        workers: [],
        category: null
      });
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
        const modelName = process.env.AI_MODEL_NAME || "glm-4-flash"; // glm-4-flash is highly stable

        console.log(`🛰️ [AI LIVE QUERY] Querying LLM API at ${apiUrl} using model ${modelName}...`);
        const token = generateZhipuToken(apiKey);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userQuery }
            ],
            temperature: 0.1
          }),
          signal: AbortSignal.timeout(8000) // ⚡ 8 second limit: never freeze the UI!
        });

        const data = await response.json();
        console.log("🛰️ [ZHIPU AI API RESPONSE]:", JSON.stringify(data, null, 2));

        if (response.ok) {
          if (data.choices && data.choices.length > 0) {
            rawResponseText = data.choices[0].message.content;
            try {
              const jsonMatch = rawResponseText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                parsedResult = JSON.parse(jsonMatch[0].trim());
              } else {
                const cleaned = rawResponseText.replace(/```json/gi, "").replace(/```/g, "").trim();
                parsedResult = JSON.parse(cleaned);
              }
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
    let matchedCategory = normalizeServiceCategory(parsedResult.service);

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
