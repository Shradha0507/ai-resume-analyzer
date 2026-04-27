const crypto = require("crypto");
const { analyzeResumeWithGemini } = require("../services/aiService");
const { getResultsContainer } = require("../services/cosmosService");
const { extractTextFromFile } = require("../utils/fileParser"); // ✅ NEW

async function analyzeResume(req, res) {
  const startedAt = Date.now();

  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // ✅ Get text from uploaded file
    const resumeText = await extractTextFromFile(req.file);

    // ✅ Job description still from input
    const jobDescription = req.body?.jobDescription;

    if (!jobDescription) {
      return res.status(400).json({ message: "Job description is required." });
    }

    const analysis = await analyzeResumeWithGemini(resumeText, jobDescription);

    const resultDocument = {
      id: crypto.randomUUID(),
      userId: req.user.userId,
      resumeText,
      jobDescription,
      score: analysis.score,
      matched_skills: analysis.matched_skills,
      missing_skills: analysis.missing_skills,
      suggestions: analysis.suggestions,
      createdAt: new Date().toISOString()
    };

    const resultsContainer = getResultsContainer();

    // ✅ Save to Cosmos DB
    await resultsContainer.items.create(resultDocument);

    console.log(
      `[analyze] User ${req.user.userId} analyzed resume in ${Date.now() - startedAt}ms`
    );

    return res.status(200).json({
      id: resultDocument.id,
      score: resultDocument.score,
      matched_skills: resultDocument.matched_skills,
      missing_skills: resultDocument.missing_skills,
      suggestions: resultDocument.suggestions,
      createdAt: resultDocument.createdAt
    });
  } catch (error) {
    console.error("[analyze] Analyze error:", error);

    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Resume analysis failed." });
  }
}

async function getHistory(req, res) {
  const startedAt = Date.now();

  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const resultsContainer = getResultsContainer();

    const query = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        ORDER BY c.createdAt DESC
      `,
      parameters: [
        { name: "@userId", value: req.user.userId }
      ]
    };

    const { resources } = await resultsContainer.items.query(query).fetchAll();

    const history = resources.slice(0, 20);

    console.log(`[history] Returned ${history.length} records in ${Date.now() - startedAt}ms`);

    return res.status(200).json({ history });
  } catch (error) {
    console.error("[history] Fetch error:", error);
    return res.status(500).json({ message: "Could not fetch analysis history." });
  }
}

module.exports = {
  analyzeResume,
  getHistory
};