import Worker from "../models/Worker.js";

// 🧠 AI SPATIAL CACHE: Prevents redundant LLM hits, accelerating repeat searches flawlessly!
const aiRadiusCache = {};

// 🤖 ACTIVE AI SPATIAL ANALYSIS ENGINE
// Dynamically consults the LLM to reveal all vicinities within a 40km radius unconditionally!
const analyzeLocationWithAi = async (cityName) => {
  const normName = cityName.toLowerCase().trim();
  
  // Return instant cache if previously interrogated!
  if (aiRadiusCache[normName]) {
     console.log("🚀 [AI CACHE HIT] Serving pre-computed 40km grid for:", normName);
     return aiRadiusCache[normName];
  }

  try {
    console.log("🛰️ [AI LIVE QUERY] Interrogating LLM for 40km radius around:", normName);
    const apiKey = process.env.AI_API_KEY;
    
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "glm-3-turbo",
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
    return [normName];
  } catch (e) {
    console.error("⚠️ [AI LOCATION ENGINE FAIL]", e);
    return [normName]; // Fallback to simple exact match if LLM times out
  }
};

export const getWorkers = async (req, res) => {
  try {
    const { city, service } = req.query;
    let filter = {};
    
    if (city) {
      // 🧠 ACTIVATE LIVE BACKEND AI INTELLIGENCE! 
      // Dynamically interrogates the LLM model to expand this location into its true 40km radius grid!
      const aiGeneratedLocations = await analyzeLocationWithAi(city);
      
      // Force-convert AI analysis results into authoritative database queries!
      let targetLocations = aiGeneratedLocations.map(loc => new RegExp(loc, "i"));

      // Expanded Match spanning all identified spatial nodes
      filter.$or = targetLocations.map(loc => ({
         $or: [{ city: loc }, { location: loc }]
      })).flat();
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

    // 🔒 CRITICAL AVAILABILITY CONTAINMENT: Only expose Active professionals globally!
    const workers = await Worker.find({ ...filter, status: "Active" });
    res.status(200).json(workers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, worker });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWorker = async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Worker profile deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
