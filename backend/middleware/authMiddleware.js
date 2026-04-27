const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Access denied. Token required." });
    }

    if (!process.env.JWT_SECRET) {
      console.error("[auth] JWT_SECRET is missing.");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    return next();
  } catch (error) {
    console.error("[auth] Token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = authMiddleware;
