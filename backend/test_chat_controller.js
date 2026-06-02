import { proxyChat } from "./controllers/chatController.js";

// Mock Express response object to capture the returned payload
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.jsonData = data;
    return this;
  }
};

const run = async () => {
  const req = {
    body: {
      messages: [
        { role: "system", content: "located near: Kakinada" },
        { role: "user", content: "need a pluber" }
      ]
    }
  };

  await proxyChat(req, mockRes);
  console.log("Status:", mockRes.statusCode);
  console.log("JSON Data:", JSON.stringify(mockRes.jsonData, null, 2));
};

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
