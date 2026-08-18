import { ZhipuAI } from "zhipuai-sdk-nodejs-v4";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
  const apiKey = process.env.AI_API_KEY;
  console.log("Testing with model glm-4...");
  
  try {
    const ai = new ZhipuAI({ apiKey });
    const response = await ai.createCompletions({
      model: "glm-4",
      messages: [
        { role: "user", content: "Hello!" }
      ]
    });
    
    console.log("Response:", JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("SDK Error:", err);
  }
};

run();
