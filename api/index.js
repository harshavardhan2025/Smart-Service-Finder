// Vercel Serverless Function Entry Point
// Uses dynamic import() to load the ES Module backend (server.js uses "type":"module"
// from backend/package.json) within a CommonJS wrapper so Vercel handles it correctly.

let appPromise = null;

const getApp = () => {
  if (!appPromise) {
    appPromise = import("../backend/server.js").then((mod) => mod.default);
  }
  return appPromise;
};

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error("Serverless function failed to initialize:", err);
    res.status(500).json({ error: "Server initialization failed: " + err.message });
  }
};
