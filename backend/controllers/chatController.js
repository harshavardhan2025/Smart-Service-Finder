import Worker from "../models/Worker.js";

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

    // Call GLM with structured system instruction to return a pure JSON string
    const systemPrompt = `You are a structured classification and conversational AI for the Workzy home service platform.
Analyze the user's message. The user's current detected location is: "${userLocation}".

We have the following services on our platform:
- "Plumbing"
- "Electrical"
- "Carpentry"
- "AC Repair"
- "Washing Machine"
- "Geyser"
- "Grinder"
- "Mixer"
- "Refrigerator"
- "Water Purifier"
- "House Cleaning"
- "Floor cleaning"
- "Utensils Cleaning"
- "Wall Putty Coating"
- "Interior Painting"
- "Exterior Painting"
- "Texture & Designer Finishers"
- "Wallpaper Installation"
- "Wood Polishing"
- "Two-Wheeler (Bikes)"
- "Four-Wheeler (Cars)"
- "Others (Heavy)"
- "Bike Wash"
- "Car Wash"
- "Photography"
- "Purohit"
- "Decor"
- "Mehandi"
- "Makeup"
- "Beauty, Salon & Spa"
- "Doctors"

You must reply with ONLY a valid JSON object matching the following keys:
1. "workerSearch": boolean (true if the user is looking for a worker, wants to hire, book, or get service for any task/problem that matches our platform services; false for general chat, questions, greetings, or guides).
2. "service": string (one of the platform services listed above if workerSearch is true and they are describing a task that fits that service, otherwise null).
3. "city": string (the city name mentioned in their query, e.g., "Kakinada", "Rajahmundry", "New Delhi", "Hyderabad", or null if not explicitly mentioned).
4. "aiResponse": string (a friendly, concise conversational response to the user. Use emojis. If they ask about services, explain how to book. If they ask about pricing/discounts, mention the plans or offers. If they ask about safety, say all workers are verified. Max 2 sentences).

Do not include any markdown formatting, no \`\`\`json wrappers, and no conversational text. Respond with ONLY the raw JSON string.`;

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "glm-3-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userQuery }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    let aiReply = "";
    
    if (data.choices && data.choices.length > 0) {
      aiReply = data.choices[0].message.content;
    } else {
      throw new Error("No choices returned from GLM model");
    }

    // Attempt to parse the structured AI response
    let parsedResult = { workerSearch: false, service: null, city: null, aiResponse: aiReply };
    try {
      const cleaned = aiReply.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleaned);
    } catch (parseErr) {
      console.warn("Failed to parse structured JSON from GLM, falling back to raw conversational reply:", parseErr.message);
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
            content: parsedResult.aiResponse || aiReply
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
