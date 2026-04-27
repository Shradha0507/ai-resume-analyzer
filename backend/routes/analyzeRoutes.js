const express = require("express");
const multer = require("multer");

const { analyzeResume, getHistory } = require("../controllers/analyzeController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Configure multer (stores file temporarily)
const upload = multer({ dest: "uploads/" });

// ✅ Updated route (supports file upload)
router.post("/analyze", authMiddleware, upload.single("resume"), analyzeResume);

router.get("/history", authMiddleware, getHistory);

module.exports = router;
