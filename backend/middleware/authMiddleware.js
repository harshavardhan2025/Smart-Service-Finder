import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // Decrypt & verify
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key_123");

      // Attach User context
      req.user = decoded;
      next();
    } catch (error) {
      console.error("🔴 Auth Failed:", error.message);
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token present" });
  }
};
