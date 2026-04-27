# AI Resume Analyzer

A complete full-stack web application that analyzes resume fit for a job description using **Google Gemini API**, with authentication and history storage in **Cosmos DB (MongoDB API compatible)**.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express.js
- AI: `@google/generative-ai` (Gemini)
- Database: Cosmos DB (MongoDB-compatible)
- Auth: JWT + bcrypt

## Project Structure

```text
root/
+-- frontend/
¦   +-- index.html
¦   +-- login.html
¦   +-- register.html
¦   +-- style.css
¦   +-- script.js
¦
+-- backend/
¦   +-- server.js
¦   +-- package.json
¦   +-- routes/
¦   ¦   +-- authRoutes.js
¦   ¦   +-- analyzeRoutes.js
¦   +-- controllers/
¦   ¦   +-- authController.js
¦   ¦   +-- analyzeController.js
¦   +-- services/
¦   ¦   +-- aiService.js
¦   ¦   +-- cosmosService.js
¦   +-- middleware/
¦   ¦   +-- authMiddleware.js
¦   ¦   +-- logger.js
¦   +-- utils/
¦   ¦   +-- fileParser.js
¦   +-- .env.example
¦
+-- .github/
¦   +-- workflows/
¦       +-- codeql.yml
¦
+-- .gitignore
+-- README.md
```

## Features

- User registration and login
- Password hashing with bcrypt
- JWT authentication
- Protected `/api/analyze` and `/api/history`
- Resume and job description analysis via Gemini
- JSON response parsing and validation
- Analysis history saved in DB
- Request/error/response-time logging (Application Insights-ready structure)
- Azure-ready setup (`process.env.PORT`, env-based secrets)

## Required Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill values:

```env
GEMINI_API_KEY=
COSMOS_URI=
COSMOS_KEY=
DATABASE_NAME=resumeDB
APPINSIGHTS_CONNECTION_STRING=
JWT_SECRET=
PORT=5000
```

### Cosmos DB Notes

- `COSMOS_URI` should be your Cosmos Mongo connection string.
- If your URI contains `<password>`, the app will replace it with `COSMOS_KEY` automatically.

## Run Locally

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Start the server:

```bash
npm start
```

3. Open the app in browser:

- Register: `http://localhost:5000/register.html`
- Login: `http://localhost:5000/login.html`
- Dashboard: `http://localhost:5000/index.html`

## API Endpoints

### Register

`POST /api/register`

Request body:

```json
{
  "name": "Alex Johnson",
  "email": "alex@example.com",
  "password": "secure123"
}
```

### Login

`POST /api/login`

Request body:

```json
{
  "email": "alex@example.com",
  "password": "secure123"
}
```

### Analyze (Protected)

`POST /api/analyze`

Headers:

```text
Authorization: Bearer <JWT_TOKEN>
```

Request body:

```json
{
  "resumeText": "Your full resume text",
  "jobDescription": "Target job description text"
}
```

Gemini output schema used by backend:

```json
{
  "score": 72,
  "matched_skills": ["JavaScript", "Node.js"],
  "missing_skills": ["Docker", "Kubernetes"],
  "suggestions": "Add hands-on project examples for Docker and Kubernetes."
}
```

### History (Protected)

`GET /api/history`

Headers:

```text
Authorization: Bearer <JWT_TOKEN>
```

## Quick API Testing with cURL

Register:

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Johnson","email":"alex@example.com","password":"secure123"}'
```

Login:

```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"secure123"}'
```

Analyze (replace token):

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"Resume text here","jobDescription":"JD text here"}'
```

History:

```bash
curl -X GET http://localhost:5000/api/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Azure Deployment Compatibility

- Backend reads `PORT` from environment for Azure App Service.
- All secrets are env-based (no hardcoded secrets).
- Frontend is plain static files (ready for Azure Static Web Apps).
- Cosmos DB connection is fully env-configurable.
- CodeQL workflow included for GitHub security analysis.

## Important Implementation Note

All resume-vs-job analysis logic (skill extraction, matching, missing skills, score, suggestions) is handled by **Gemini AI** in `backend/services/aiService.js`. No rule-based NLP scoring is used.
