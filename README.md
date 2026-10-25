# 🕵️ AI Mystery Room

An interactive detective investigation web application where players solve AI-generated mysteries powered by Google Gemini. Players inspect crime scenes, interrogate suspects, discover clues, request progressive hints, and submit a final accusation for authoritative server-side scoring and solution reveal.

---

## 📌 Project Overview

- **Difficulty Levels:** Easy (3 suspects, 5 clues, 2 hints), Medium (4 suspects, 7 clues, 3 hints), and Hard (5 suspects, 9 clues, 3 hints).
- **Core Loop:**
  1. Input a premise and choose difficulty.
  2. Gemini AI generates a logically consistent, fair mystery.
  3. Investigate suspects, unearth clues, and unlock strategic hints.
  4. Submit an accusation to receive a verdict, culprit reveal, and detailed score breakdown.
- **Security by Design:**
  - Gemini API keys exist exclusively on the server.
  - Active case responses never leak the culprit or solution before final accusation.
  - All scoring is strictly validated and computed server-side.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (LTS, ES modules)
- **Framework:** Express
- **Database:** MongoDB Atlas + Mongoose
- **AI SDK:** Google Gen AI SDK (`@google/genai`)
- **Validation:** Zod
- **Security & Utilities:** Helmet, CORS, Express Rate Limit, Dotenv, Nodemon

---

## 📁 Repository Structure

```text
ai-mystery-room/
├── SPEC.md                      # Source-of-truth implementation specification
├── README.md                    # Project documentation
├── .gitignore                   # Root gitignore protecting secrets and artifacts
├── package.json                 # Root script runner for convenience
├── client/
│   ├── package.json             # Frontend dependencies & scripts
│   ├── vite.config.js           # Vite + Tailwind configuration
│   ├── index.html               # Main HTML entrypoint
│   ├── .env.example             # Frontend environment variables template
│   └── src/
│       ├── main.jsx             # React DOM root
│       ├── App.jsx              # Main App component
│       ├── index.css            # Tailwind CSS base styles
│       ├── components/          # Reusable UI components
│       ├── pages/               # Route views (Home, Create, Investigate, Accuse, Results)
│       ├── services/            # Axios API service
│       ├── hooks/               # Custom React hooks
│       └── utils/               # Client helpers
└── server/
    ├── package.json             # Backend dependencies & scripts
    ├── .env.example             # Backend environment variables template
    └── src/
        ├── app.js               # Express application configuration & middleware
        ├── server.js            # Server entrypoint and graceful shutdown
        ├── config/              # Database connection
        ├── models/              # Mongoose Case schema
        ├── routes/              # Express API route modules
        ├── controllers/         # Case and gameplay controllers
        ├── services/            # Gemini AI, Case, and Scoring services
        ├── validators/          # Zod schemas for input and AI output
        ├── middleware/          # Rate limiting, error handling, 404 handler
        └── utils/               # Public case serializer and API error classes
```

---

## ⚙️ Environment Variables

### Backend (`server/.env.example`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai_mystery_room?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`client/.env.example`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> **Security Note:** Never commit `.env` or `.env.local` files containing real credentials or API keys.

---

## 🚀 Local Setup & Running

### 1. Clone & Prerequisites
Ensure you have Node.js (v20+ LTS recommended) and npm installed:
```bash
node -v
npm -v
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your MONGODB_URI and GEMINI_API_KEY
npm install
npm run dev
```
Backend health check is accessible at `http://localhost:5000/api/health`.

### 3. Frontend Setup
```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```
Frontend development server runs at `http://localhost:5173`.

### 4. Running Both with Root Scripts
From the repository root:
```bash
npm run server:dev   # Starts Express backend
npm run client:dev   # Starts Vite frontend
```

---

## 🧪 Testing

- **Backend tests:**
  ```bash
  npm run server:test
  ```
- **Frontend build test:**
  ```bash
  npm run client:build
  ```

---

## 🌐 Deployment URLs

*(To be updated upon completing Milestone 7)*
- **Frontend Live URL:** TBD
- **Backend API URL:** TBD

---

## ⚠️ Known Limitations (Version 1)

- Single-player experience without user account persistence across multiple devices.
- No real-time multiplayer or co-op.
- Rate limits apply to AI case generation to prevent quota exhaustion.
