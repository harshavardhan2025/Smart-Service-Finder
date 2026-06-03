import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

function generateZhipuToken(apiKey) {
  const [id, secret] = apiKey.split('.');

  const now = Date.now();
  const payload = {
    api_key: id,
    exp: now + 3600 * 1000, // 1 hour
    timestamp: now
  };

  const token = jwt.sign(
    payload,
    secret,
    {
      algorithm: 'HS256',
      header: {
        alg: 'HS256',
        sign_type: 'SIGN'
      }
    }
  );

  return token;
}

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
