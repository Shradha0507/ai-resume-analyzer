const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const analyzeRoutes = require("./routes/analyzeRoutes");
const logger = require("./middleware/logger");

const appInsights = require("applicationinsights");

if (process.env.APPINSIGHTS_CONNECTION_STRING) {
  appInsights
    .setup(process.env.APPINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .start();

  console.log("Application Insights initialized");
}

const appInsights = require("applicationinsights");

app.post("/api/login", (req, res) => {
  appInsights.defaultClient.trackEvent({
    name: "UserLogin",
    properties: { email: req.body.email }
  });
});

// ✅ NEW IMPORT (Cosmos NoSQL)
const { initializeCosmos } = require("./services/cosmosService");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5000",
      "http://localhost:5500",
      "https://agreeable-bush-036948700.7.azurestaticapps.net"
    ];

    if (allowedOrigins.includes(origin) || origin.includes(".azurestaticapps.net")) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS blocked"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", authRoutes);
app.use("/api", analyzeRoutes);

// ✅ Root route (replace frontend serving)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
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
