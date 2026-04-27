const fs = require("fs");
const pdfParse = require("pdf-parse/lib/pdf-parse");
const mammoth = require("mammoth");

// ✅ OLD FUNCTION (keep for optional use)
function parseTextInput(value, fieldName) {
  if (typeof value !== "string") {
    const error = new Error(`${fieldName} must be a string.`);
    error.statusCode = 400;
    throw error;
  }

  const normalizedText = value.replace(/\r\n/g, "\n").trim();

  if (!normalizedText) {
    const error = new Error(`${fieldName} is required.`);
    error.statusCode = 400;
    throw error;
  }

  if (normalizedText.length > 20000) {
    const error = new Error(`${fieldName} is too long. Keep it under 20,000 characters.`);
    error.statusCode = 400;
    throw error;
  }

  return normalizedText;
}

// ✅ NEW FUNCTION (MAIN FEATURE)
async function extractTextFromFile(file) {
  if (!file) {
    const error = new Error("Resume file is required.");
    error.statusCode = 400;
    throw error;
  }

  const filePath = file.path;

  try {
    // 📄 PDF
    if (file.mimetype === "application/pdf") {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text.trim();
    }

    // 📄 DOCX
    if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value.trim();
    }

    const error = new Error("Only PDF and DOCX files are supported.");
    error.statusCode = 400;
    throw error;
  } catch (err) {
    console.error("[fileParser] Error parsing file:", err);
    const error = new Error("Failed to process resume file.");
    error.statusCode = 500;
    throw error;
  } finally {
    // 🧹 Delete uploaded temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = {
  parseTextInput,
  extractTextFromFile
};
