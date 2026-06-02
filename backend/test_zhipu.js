import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const generateZhipuToken = (apiKey) => {
  if (!apiKey || !apiKey.includes(".")) return "";
  const [id, secret] = apiKey.split(".");
  const timestamp = Date.now(); // Milliseconds!
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

const run = async () => {
  const apiKey = process.env.AI_API_KEY;
  console.log("Testing API Key:", apiKey);
  const token = generateZhipuToken(apiKey);
  console.log("Generated Token:", token);
  
  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "user", content: "Tell me a joke" }
        ]
      })
    });
    
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
};

run();
