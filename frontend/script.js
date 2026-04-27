const DEFAULT_API_BASE_URL =
  !window.location.hostname ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "/api";

const API_BASE_URL = localStorage.getItem("apiBaseUrl") || DEFAULT_API_BASE_URL;

function setMessage(elementId, text, type = "") {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function getToken() {
  return localStorage.getItem("token");
}

function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function readUser() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
}

async function apiRequest(path, options = {}, withAuth = false) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (withAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(responseData.message || "Request failed");
    error.statusCode = response.status;
    throw error;
  }

  return responseData;
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  setMessage("registerMessage", "");

  try {
    await apiRequest("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });

    setMessage("registerMessage", "Registration successful. Redirecting to login...", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  } catch (error) {
    setMessage("registerMessage", error.message, "error");
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  setMessage("loginMessage", "");

  try {
    const data = await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    saveAuth(data.token, data.user);
    setMessage("loginMessage", "Login successful. Redirecting...", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 600);
  } catch (error) {
    setMessage("loginMessage", error.message, "error");
  }
}

function renderSkillList(containerId, skills, emptyLabel) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(skills) || skills.length === 0) {
    const item = document.createElement("li");
    item.textContent = emptyLabel;
    container.appendChild(item);
    return;
  }

  skills.forEach((skill) => {
    const item = document.createElement("li");
    item.textContent = skill;
    container.appendChild(item);
  });
}

function renderAnalysisResult(data) {
  const resultCard = document.getElementById("resultCard");
  if (!resultCard) return;

  resultCard.classList.remove("hidden");

  const scoreValue = document.getElementById("scoreValue");
  const suggestions = document.getElementById("suggestions");

  if (scoreValue) scoreValue.textContent = String(data.score ?? 0);
  if (suggestions) suggestions.textContent = data.suggestions || "No suggestions returned.";

  renderSkillList("matchedSkills", data.matched_skills, "No matched skills detected");
  renderSkillList("missingSkills", data.missing_skills, "No missing skills detected");
}

function createHistoryCard(result) {
  const card = document.createElement("article");
  card.className = "history-item";

  const dateText = result.createdAt
    ? new Date(result.createdAt).toLocaleString()
    : "Unknown time";

  card.innerHTML = `
    <p><strong>Score:</strong> ${result.score}</p>
    <p><strong>Matched:</strong> ${(result.matched_skills || []).join(", ") || "None"}</p>
    <p><strong>Missing:</strong> ${(result.missing_skills || []).join(", ") || "None"}</p>
    <p><strong>Created:</strong> ${dateText}</p>
  `;

  return card;
}

async function loadHistory() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.innerHTML = "Loading history...";

  try {
    const data = await apiRequest("/history", { method: "GET" }, true);

    historyList.innerHTML = "";

    if (!Array.isArray(data.history) || data.history.length === 0) {
      historyList.textContent = "No analysis history yet.";
      return;
    }

    data.history.forEach((entry) => {
      historyList.appendChild(createHistoryCard(entry));
    });
  } catch (error) {
    if (error.statusCode === 401) {
      clearAuth();
      window.location.href = "login.html";
      return;
    }

    historyList.textContent = `Failed to load history: ${error.message}`;
  }
}

async function handleAnalyzeSubmit(event) {
  event.preventDefault();

  const analyzeButton = document.getElementById("analyzeButton");
  const fileInput = document.getElementById("resumeFile");
  const jobDescription = document.getElementById("jobDescription").value;

  setMessage("analyzeMessage", "");

  if (!fileInput.files[0]) {
    setMessage("analyzeMessage", "Please upload a resume file.", "error");
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Analyzing...";

  try {
    const formData = new FormData();

    // ✅ file must match backend: upload.single("resume")
    formData.append("resume", fileInput.files[0]);
    formData.append("jobDescription", jobDescription);

    const token = getToken();

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Analysis failed");
    }

    renderAnalysisResult(result);
    setMessage("analyzeMessage", "Analysis completed successfully.", "success");

    await loadHistory();
  } catch (error) {
    if (error.statusCode === 401) {
      clearAuth();
      window.location.href = "login.html";
      return;
    }

    setMessage("analyzeMessage", error.message, "error");
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analyze with Gemini";
  }
}

function setupRegisterPage() {
  const form = document.getElementById("registerForm");
  if (form) {
    form.addEventListener("submit", handleRegisterSubmit);
  }
}

function setupLoginPage() {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", handleLoginSubmit);
  }
}

function setupDashboardPage() {
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const user = readUser();
  const welcomeText = document.getElementById("welcomeText");
  if (welcomeText && user?.name) {
    welcomeText.textContent = `Hi ${user.name}, compare resumes and job descriptions instantly.`;
  }

  const analyzeForm = document.getElementById("analyzeForm");
  if (analyzeForm) {
    analyzeForm.addEventListener("submit", handleAnalyzeSubmit);
  }

  const logoutButton = document.getElementById("logoutBtn");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearAuth();
      window.location.href = "login.html";
    });
  }

  loadHistory();
}

function initPage() {
  const page = document.body.dataset.page;

  if (page === "register") {
    setupRegisterPage();
    return;
  }

  if (page === "login") {
    setupLoginPage();
    return;
  }

  if (page === "dashboard") {
    setupDashboardPage();
  }
}

document.addEventListener("DOMContentLoaded", initPage);
