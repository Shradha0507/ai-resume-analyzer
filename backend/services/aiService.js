const axios = require("axios");

function buildPrompt(resumeText, jobDescription) {
  return `
You are an expert technical recruiter.

Analyze the resume and job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Tasks:
1. Extract skills from resume
2. Extract required skills from job description
3. Find matched skills
4. Find missing skills
5. Give score (0-100)
6. Give improvement suggestions

IMPORTANT:
Return ONLY valid JSON. No explanation.

Format:
{
  "score": number,
  "matched_skills": [],
  "missing_skills": [],
  "suggestions": ""
}
`;
}

function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Invalid JSON from Gemini");
    return JSON.parse(match[0]);
  }
}

async function analyzeResumeWithGemini(resumeText, jobDescription) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const prompt = buildPrompt(resumeText, jobDescription);

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    const text =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = extractJSON(text);

    return {
      score: parsed.score || 0,
      matched_skills: parsed.matched_skills || [],
      missing_skills: parsed.missing_skills || [],
      suggestions: parsed.suggestions || ""
    };
  } catch (error) {
    console.error("[ai] Gemini API error:", error.response?.data || error.message);
    throw new Error("Gemini analysis failed");
  }
}

module.exports = {
  analyzeResumeWithGemini
};
