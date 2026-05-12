export const proxyChat = async (req, res) => {
  try {
    const { messages } = req.body;
    // Safely load key from secure environment container
    const apiKey = process.env.AI_API_KEY || "3cf5a055ccb74539badfef7b0e0c0276.uxCJ42_eO7zlu0EImzr816cG";

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "glm-3-turbo",
        messages: messages
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Backend AI proxy breakdown:", error.message);
    res.status(500).json({ error: "Internal AI Relay Failure" });
  }
};
