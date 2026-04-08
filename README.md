# Portfolio Advisor

A personal investment portfolio tracker with a persistent AI advisor. Built to run on Railway with full data persistence via SQLite on a mounted volume.

---

## What it does

- **Portfolio tracker** — edit your positions, see breakdowns by region, type, and platform
- **Allocation planner** — model where to put new money with sliders, see projected totals
- **AI Advisor** — one continuous conversation that remembers everything across sessions. Ask anything, get allocation advice, discuss strategy. Never loses history.
- **Research** — AI-powered deep dives on specific topics (Spain tax, ARS exit strategies, ETFs, crypto)

---

## Deploy on Railway (step by step)

### Prerequisites
- A [Railway](https://railway.app) account (free tier works)
- A [GitHub](https://github.com) account
- An [OpenRouter](https://openrouter.ai) API key

---

### Step 1 — Push to GitHub

```bash
# Extract the project
tar -xzf portfolio-advisor.tar.gz
cd portfolio-advisor

# Create a private GitHub repo and push
git init
git add .
git commit -m "initial commit"

# Using GitHub CLI:
gh repo create portfolio-advisor --private --source=. --push

# Or manually: create repo on github.com, then:
# git remote add origin https://github.com/YOUR_USERNAME/portfolio-advisor.git
# git push -u origin main
```

---

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project**
3. Choose **Deploy from GitHub repo**
4. Select your `portfolio-advisor` repository
5. Railway will detect the `railway.toml` and start building

The first build takes ~2 minutes (installs deps, builds React).

---

### Step 3 — Add a Volume (CRITICAL for persistence)

Without a volume, your SQLite database lives on the container filesystem and gets **wiped on every deploy or restart**. The volume mounts persistent storage that survives everything.

1. In your Railway project, click on your service
2. Go to the **Volumes** tab
3. Click **Add a Volume**
4. Set the **Mount Path** to `/data`
5. Click **Add**

Railway will automatically set `RAILWAY_VOLUME_MOUNT_PATH=/data` as an env var, which the server uses to store the database file.

> **Note:** Volumes on Railway's free tier persist as long as your project is active. On paid plans they are backed up automatically.

---

### Step 4 — Set environment variables

In your Railway service, go to the **Variables** tab and add these:

| Variable | Value | Notes |
|---|---|---|
| `APP_USERNAME` | `your_username` | Your login username |
| `APP_PASSWORD` | `your_secure_password` | Your login password |
| `JWT_SECRET` | *(long random string)* | See generation command below |
| `OPENROUTER_API_KEY` | `sk-or-...` | From openrouter.ai/keys |
| `AI_MODEL` | `anthropic/claude-sonnet-4-5` | See model options below |
| `APP_URL` | `https://your-app.up.railway.app` | Set after first deploy (used as HTTP-Referer for OpenRouter) |
| `NODE_ENV` | `production` | Already set by railway.toml |

**Generate a JWT_SECRET** (run this locally):
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

### Step 5 — Get your public URL

After the first successful deploy:
1. Go to your service → **Settings** → **Networking**
2. Click **Generate Domain** if you don't have one yet
3. Copy the URL (e.g. `https://portfolio-advisor-production-xxxx.up.railway.app`)
4. Go back to **Variables** and set `APP_URL` to that URL
5. Railway will automatically redeploy

---

### Step 6 — Sign in

Open your Railway URL and sign in with the `APP_USERNAME` and `APP_PASSWORD` you set. Sessions last 30 days (JWT in httpOnly cookie).

---

## Available AI models (OpenRouter)

Set any of these as `AI_MODEL`. Prices are per million tokens (input/output).

| Model | Notes |
|---|---|
| `anthropic/claude-sonnet-4-5` | Best quality, recommended |
| `anthropic/claude-haiku-4-5` | Faster, cheaper |
| `openai/gpt-4o` | Good alternative |
| `openai/gpt-4o-mini` | Very cheap |
| `google/gemini-2.0-flash-001` | Fast and cheap |
| `meta-llama/llama-3.3-70b-instruct` | Free tier available on OpenRouter |

Full list: [openrouter.ai/models](https://openrouter.ai/models)

You can swap the model anytime by updating the env var — no code changes needed.

---

## How data persistence works

```
Railway Volume (/data)
    └── portfolio.db          ← SQLite database
            ├── kv: portfolio-positions   ← your portfolio values
            └── kv: chat-history          ← entire AI conversation history
```

- **Portfolio positions** are saved to the database on every edit
- **Chat history** is saved to the database after every message
- Both survive: deploys, restarts, Railway maintenance, and plan changes
- The database file lives at `/data/portfolio.db` on the volume

---

## Local development

```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Run backend (port 3001)
node server/index.js

# 4. In a second terminal, run frontend with hot reload (port 5173)
cd client && npm run dev

# Open http://localhost:5173
# The frontend proxies /api requests to the backend automatically (vite.config.js)
```

---

## Architecture

```
portfolio-advisor/
├── server/
│   └── index.js          Express server
│                          ├── POST /api/login       → sets httpOnly JWT cookie
│                          ├── POST /api/logout      → clears cookie
│                          ├── GET  /api/me          → verify auth
│                          ├── GET/PUT/DELETE        → SQLite key-value storage
│                          │   /api/storage/:key
│                          ├── POST /api/ai          → proxies to OpenRouter
│                          │                          (API key never sent to client)
│                          └── GET *                 → serves React build
├── client/
│   └── src/
│       ├── App.jsx        Full React UI
│       ├── api.js         Thin API client (all calls go through backend)
│       └── main.jsx       Entry point
├── railway.toml           Build + deploy config
└── .env.example           All environment variables documented
```

**Security notes:**
- OpenRouter API key is only in the backend — never exposed to the browser
- JWT is stored in an httpOnly cookie — not accessible to JavaScript (XSS-safe)
- All API routes require a valid JWT
- Login is a simple username/password check against env vars — no user database needed

---

## Updating the app

After making code changes:
```bash
git add .
git commit -m "your changes"
git push
```

Railway auto-deploys on push. The volume (database) is unaffected by deploys.

---

## Troubleshooting

**App crashes on startup**
→ Check that all 4 required env vars are set: `JWT_SECRET`, `APP_USERNAME`, `APP_PASSWORD`, `OPENROUTER_API_KEY`

**Data lost after redeploy**
→ Make sure the Volume is attached with mount path `/data`. Check Railway Volumes tab.

**AI not responding**
→ Check your OpenRouter API key and that your account has credits. Check Railway logs for the error from OpenRouter.

**Can't log in**
→ Double-check `APP_USERNAME` and `APP_PASSWORD` env vars. They must match exactly (case-sensitive).

**Build fails**
→ Check Railway build logs. Usually a missing dependency or Node version issue. The `engines.node` in `package.json` requires Node 18+.
