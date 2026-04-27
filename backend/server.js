const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const analyzeRoutes = require("./routes/analyzeRoutes");
const logger = require("./middleware/logger");

// ✅ NEW IMPORT (Cosmos NoSQL)
const { initializeCosmos } = require("./services/cosmosService");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Optional Application Insights log
if (process.env.APPINSIGHTS_CONNECTION_STRING) {
  console.log("[startup] APPINSIGHTS_CONNECTION_STRING found.");
}

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", authRoutes);
app.use("/api", analyzeRoutes);

// Serve frontend
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  return res.sendFile(path.join(frontendPath, "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[error] Unhandled application error:", err);
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: statusCode === 500 ? "Internal server error" : err.message
  });
});

// ✅ START SERVER
async function startServer() {
  try {
    // 🔥 Initialize Cosmos DB (IMPORTANT)
    initializeCosmos();

    app.listen(PORT, () => {
      console.log(`[startup] Server running on port ${PORT}`);
      console.log(`[startup] Open http://localhost:${PORT}/register.html`);
    });
  } catch (error) {
    console.error("[startup] Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
