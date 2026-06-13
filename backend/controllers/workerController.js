import crypto from "crypto";
import Worker from "../models/Worker.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";
import { haversineKm, geocodeCity, getPriceMultiplier } from "../utils/geoUtils.js";
import { getCache, setCache, getVersion, invalidateVersion } from "../config/redisClient.js";

// 🧠 AI SPATIAL CACHE: Prevents redundant LLM hits, accelerating repeat searches flawlessly!
const aiRadiusCache = {};

// 🚀 HIGH-PERFORMANCE LOCAL GEOSPATIAL CLUSTER DICTIONARY
// Provides instant offline/timeout fallback cluster expansion for seeded locations.
const LOCAL_CLUSTER_FALLBACKS = {
  "rajahmundry": ["rajahmundry", "kovvur", "dowleswaram", "diwancheruvu", "hukumpeeta", "kadiam", "morampudi", "bomuru", "lalacheruvu", "pidimgoyyi"],
  "kakinada": ["kakinada", "samalkot", "peddapuram", "pithapuram", "karanampetta", "sarpavaram", "chollangi", "ramanayyapeta", "turangi", "yanam"],
  "new delhi": ["new delhi", "noida", "gurugram", "ghaziabad", "faridabad", "dwarka", "rohini", "saket", "vasant kunj", "connaught place", "karol bagh"],
  "hyderabad": ["hyderabad", "secunderabad", "gachibowli", "hitech city", "madhapur", "kondapur", "kukatpally", "begumpet", "banjara hills", "jubilee hills"]
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

// 🤖 ACTIVE AI SPATIAL ANALYSIS ENGINE
// Dynamically consults the LLM to reveal all vicinities within a 40km radius unconditionally!
const analyzeLocationWithAi = async (cityName) => {
  const normName = cityName.toLowerCase().trim();
  
  // 🚀 HIGH-PERFORMANCE INSTANT PRE-COMPUTED LOCAL BYPASS
  // Instantly serve our complete seeded 40km local clusters, avoiding heavy 2.5s network LLM calls!
  if (LOCAL_CLUSTER_FALLBACKS[normName]) {
     aiRadiusCache[normName] = LOCAL_CLUSTER_FALLBACKS[normName];
     return LOCAL_CLUSTER_FALLBACKS[normName];
  }

  // Return instant cache if previously interrogated!
  if (aiRadiusCache[normName]) {
     console.log("🚀 [AI CACHE HIT] Serving pre-computed 40km grid for:", normName);
     return aiRadiusCache[normName];
  }

  try {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey || apiKey.trim().length < 10) {
       console.warn("⚠️ [AI LOCATION ENGINE] No valid AI_API_KEY configured. Serving local cluster fallback.");
       return [normName];
    }

    const apiUrl = process.env.AI_API_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions";
    const modelName = process.env.AI_MODEL_NAME || "glm-3-turbo";

    console.log(`🛰️ [AI LIVE QUERY] Querying LLM API at ${apiUrl} using model ${modelName} for 40km radius around: ${normName}...`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${generateZhipuToken(apiKey)}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content: `You are a professional Geospatial Assistant. The user will provide a location name. 
            Return ONLY a simple comma-separated list of the top 12-15 major residential areas, sub-towns, and connected municipalities located strictly within a 30-40km radius of that location. 
            DO NOT include any conversational text, explanations, or numbers. Just comma-separated location names.`
          },
          {
            role: "user",
            content: `Analyze the 40km radius surroundings of the following location: ${normName}`
          }
        ]
      }),
      signal: AbortSignal.timeout(2500) // ⚡ INSTANT FALLBACK: Never freeze frontend UX!
    });

    const data = await response.json();
    console.log("🛰️ [AI LOCATION ENGINE RESPONSE]:", JSON.stringify(data, null, 2));

    if (!response.ok) {
       console.error(`⚠️ [AI LOCATION ENGINE FAIL] Endpoint returned HTTP ${response.status}. Serving local cluster fallback.`);
       if (LOCAL_CLUSTER_FALLBACKS[normName]) {
          aiRadiusCache[normName] = LOCAL_CLUSTER_FALLBACKS[normName];
          return LOCAL_CLUSTER_FALLBACKS[normName];
       }
       return [normName];
    }
    if (data.choices && data.choices.length > 0) {
       const aiContent = data.choices[0].message.content;
       // Clean up potential conversational leakage and split by comma
       const expansions = aiContent.split(",").map(loc => loc.replace(/[^a-zA-Z0-9\s]/g, "").trim().toLowerCase()).filter(loc => loc.length > 1);
       
       // Always include original searched term just in case AI drops it
       expansions.unshift(normName);
       
       // Save cache & return
       aiRadiusCache[normName] = [...new Set(expansions)]; // deduplicate
       console.log("✅ [AI ANALYSIS COMPLETE] Cluster Constructed:", aiRadiusCache[normName]);
       return aiRadiusCache[normName];
    }
    
    if (LOCAL_CLUSTER_FALLBACKS[normName]) {
       aiRadiusCache[normName] = LOCAL_CLUSTER_FALLBACKS[normName];
       return LOCAL_CLUSTER_FALLBACKS[normName];
    }
    return [normName];
  } catch (e) {
    console.error("⚠️ [AI LOCATION ENGINE FAIL] Activating Local Geospatial Cluster Fallback:", e.message);
    if (LOCAL_CLUSTER_FALLBACKS[normName]) {
       console.log("✅ [LOCAL CLUSTER FALLBACK] Serving offline cluster for:", normName);
       aiRadiusCache[normName] = LOCAL_CLUSTER_FALLBACKS[normName];
       return LOCAL_CLUSTER_FALLBACKS[normName];
    }
    return [normName]; // Fallback to simple exact match if LLM times out
  }
};

export const getWorkers = async (req, res) => {
  try {
    const { city, service } = req.query;
    const adminView = req.query.adminView || "false";
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

    // Check Redis cache first
    const version = await getVersion("workers");
    const cacheKey = `workers:list:v${version}:${city || ''}:${service || ''}:${adminView}:${page || ''}:${limit || ''}`;
    
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`🚀 [REDIS CACHE HIT] Serving workers list for key: ${cacheKey}`);
      return res.status(200).json(cachedData);
    }

    let filter = {};
    
    if (city) {
      // 🧠 ACTIVATE LIVE BACKEND AI INTELLIGENCE! 
      // Dynamically interrogates the LLM model to expand this location into its true 40km radius grid!
      const aiGeneratedLocations = await analyzeLocationWithAi(city);
      
      // Force-convert AI analysis results into authoritative database queries!
      let targetLocations = aiGeneratedLocations.map(loc => new RegExp(loc, "i"));

      // Expanded Match spanning all identified spatial nodes flawlessly
      filter.$or = [
         { city: { $in: targetLocations } },
         { location: { $in: targetLocations } }
      ];
    }
    
    if (service) {
      // Handle existing $or logic gracefully by merging
      const sFilter = { service: new RegExp(service, "i") };
      if (filter.$or) {
         // To keep both location OR and service filtering together
         filter.$and = [{ $or: filter.$or }, sFilter];
         delete filter.$or;
      } else {
         filter.service = new RegExp(service, "i");
      }
    }

    // 🔒 CRITICAL AVAILABILITY CONTAINMENT: Default to exposing only Active professionals unless explicit request!
    const statusFilter = adminView === "true" ? {} : { status: "Active" };

    let query = Worker.find({ ...filter, ...statusFilter })
      .select("_id name email service city location lat lon rating reviews price status experience walletBalance");

    if (page && limit) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    const workers = await query;
    
    // Save to Redis cache
    await setCache(cacheKey, workers, 120);

    res.status(200).json(workers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/workers/nearby?lat=XX&lng=YY&radius=40&service=Plumber
 * Returns workers within `radius` km (default 40) of the given coordinates.
 * Each worker gets a `distanceKm` field and results are sorted nearest-first.
 */
export const getNearbyWorkers = async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const radius  = parseFloat(req.query.radius) || 40; // km
    const service  = req.query.service || "";

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ error: "lat and lng query params are required." });
    }

    // Check Redis cache first
    const version = await getVersion("workers");
    const cacheKey = `workers:nearby:v${version}:${userLat}:${userLng}:${radius}:${service}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`🚀 [REDIS CACHE HIT] Serving nearby workers for key: ${cacheKey}`);
      return res.status(200).json(cachedData);
    }

    // Build service filter
    const filter = { status: "Active" };
    if (service) filter.service = new RegExp(service, "i");

    const allWorkers = await Worker.find(filter).lean();

    // Map workers to coordinates (utilizes pre-saved coords, heals missing records)
    const withCoords = await Promise.all(
      allWorkers.map(async (w) => {
        let lat = w.lat;
        let lon = w.lon;

        // Auto-heal missing coords for unseeded or legacy entries
        if (lat === undefined || lon === undefined || lat === null || lon === null) {
          let cityStr = "";
          if (w.location && w.city) {
            const locClean = w.location.toLowerCase().trim();
            const cityClean = w.city.toLowerCase().trim();
            if (locClean !== cityClean) {
              cityStr = `${w.location}, ${w.city}`;
            } else {
              cityStr = w.city;
            }
          } else {
            cityStr = w.location || w.city || "";
          }

          if (cityStr) {
            try {
              let coords = await geocodeCity(cityStr);
              if (!coords && w.city) {
                coords = await geocodeCity(w.city);
              }
              if (coords) {
                lat = coords.lat;
                lon = coords.lon;
                // Persist back to database so future requests are 0ms
                await Worker.findByIdAndUpdate(w._id, { lat, lon });
              }
            } catch (err) {
              console.error(`[getNearbyWorkers] Failed to heal coordinates for worker ${w.name}:`, err.message);
            }
          }
        }

        if (lat === undefined || lon === undefined || lat === null || lon === null) {
          return null;
        }

        const distanceKm = haversineKm(userLat, userLng, lat, lon);
        return { ...w, lat, lng: lon, distanceKm: Math.round(distanceKm * 10) / 10 };
      })
    );

    // Filter to radius and sort by distance
    const nearby = withCoords
      .filter((w) => w !== null && w.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    console.log(`[NearbyWorkers] ${nearby.length} workers within ${radius}km of (${userLat},${userLng})`);
    
    // Save to Redis cache
    await setCache(cacheKey, nearby, 120);

    res.status(200).json(nearby);
  } catch (error) {
    console.error("[getNearbyWorkers] Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: "Worker profile not found." });
    }

    if (req.user.role !== "admin" && req.user.email !== worker.email) {
      return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }

    Object.assign(worker, req.body);
    await worker.save();

    // Invalidate Redis cache
    await invalidateVersion("workers");

    res.status(200).json({ success: true, worker });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    
    // Invalidate Redis cache
    await invalidateVersion("workers");

    res.status(200).json({ success: true, message: "Worker profile deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createWorker = async (req, res) => {
  try {
    const worker = await Worker.create(req.body);

    // Invalidate Redis cache
    await invalidateVersion("workers");

    res.status(201).json(worker);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const geocodeLocation = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "q query param is required." });
    }
    
    const coords = await geocodeCity(query);
    if (coords) {
      const city = coords.city || query.charAt(0).toUpperCase() + query.slice(1);
      const label = coords.label || query.charAt(0).toUpperCase() + query.slice(1);
      const priceMultiplier = getPriceMultiplier(city);
      
      res.status(200).json({ lat: coords.lat, lon: coords.lon, label, city, priceMultiplier });
    } else {
      res.status(404).json({ error: "Location not found." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendMoneyToWorker = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount specified." });
    }

    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found." });
    }

    worker.walletBalance = (worker.walletBalance || 0) + Number(amount);
    await worker.save();

    // Create Transaction record
    await Transaction.create({
      customer: "Admin Deposit",
      worker: worker.name,
      service: reason || "Admin Top-up / Compensation",
      amount: Number(amount),
      status: "Paid Out",
      method: "Admin Adjustment"
    });

    // Notify the worker
    try {
      const workerUser = await User.findOne({ email: worker.email });
      if (workerUser) {
        await Notification.create({
          role: "worker",
          user_id: workerUser._id.toString(),
          title: "💰 Money Received from Admin",
          message: `Admin has credited ₹${amount} to your wallet. Note: ${reason || "No reason specified."}`,
          type: "success",
          is_read: false
        });
      }
    } catch (err) {
      console.error("Error creating notification for worker:", err);
    }

    res.status(200).json({ success: true, message: `Successfully sent ₹${amount} to worker ${worker.name}.`, walletBalance: worker.walletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


