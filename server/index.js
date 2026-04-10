import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ─── ENV ──────────────────────────────────────────────────────────────────────
const PORT           = process.env.PORT || 3001;
const JWT_SECRET     = process.env.JWT_SECRET;
const APP_USERNAME   = process.env.APP_USERNAME;
const APP_PASSWORD   = process.env.APP_PASSWORD;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL       = process.env.AI_MODEL || "anthropic/claude-sonnet-4-5";

if (!JWT_SECRET || !APP_USERNAME || !APP_PASSWORD || !OPENROUTER_KEY) {
  console.error("ERROR: Missing required env vars: JWT_SECRET, APP_USERNAME, APP_PASSWORD, OPENROUTER_API_KEY");
  process.exit(1);
}

// ─── DATABASE ─────────────────────────────────────────────────────────────────
// On Railway, mount a volume at /data for persistence
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "portfolio.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS kv (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);
const stmtGet = db.prepare("SELECT value FROM kv WHERE key = ?");
const stmtSet = db.prepare(`
  INSERT INTO kv(key, value, updated_at) VALUES(?,?,datetime('now'))
  ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')
`);
const stmtDel = db.prepare("DELETE FROM kv WHERE key = ?");

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// ─── AUTH HELPER ─────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username !== APP_USERNAME || password !== APP_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "30d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

// ─── STORAGE ROUTES ───────────────────────────────────────────────────────────
app.get("/api/storage/:key", requireAuth, (req, res) => {
  const row = stmtGet.get(req.params.key);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json({ value: row.value });
});

app.put("/api/storage/:key", requireAuth, (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: "Missing value" });
  stmtSet.run(req.params.key, typeof value === "string" ? value : JSON.stringify(value));
  res.json({ ok: true });
});

app.delete("/api/storage/:key", requireAuth, (req, res) => {
  stmtDel.run(req.params.key);
  res.json({ ok: true });
});

// ─── AI PROXY ─────────────────────────────────────────────────────────────────
app.post("/api/ai", requireAuth, async (req, res) => {
  const { messages, system } = req.body;
  if (!messages || !system) return res.status(400).json({ error: "Missing fields" });

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://portfolio-advisor.up.railway.app",
        "X-Title": "Portfolio Advisor",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 1500,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("OpenRouter error:", txt);
      return res.status(resp.status).json({ error: "AI service error", detail: txt });
    }

    const data = await resp.json();
    res.json({ content: data.choices?.[0]?.message?.content || "" });
  } catch (err) {
    console.error("AI proxy error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
});

// ─── PRICE FETCHING ───────────────────────────────────────────────────────────
const CRYPTO_IDS = { BTC:"bitcoin", ETH:"ethereum", SOL:"solana", MATIC:"matic-network", BNB:"binancecoin" };

async function yfFetch(symbol) {
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  if (!r.ok) return null;
  const d = await r.json();
  const meta = d?.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice) return null;
  const prev = meta.chartPreviousClose || meta.regularMarketPrice;
  return { price: meta.regularMarketPrice, currency: meta.currency, change24h: ((meta.regularMarketPrice - prev) / prev) * 100 };
}

// stooq suffix → currency
const STOOQ_CURRENCY = { DE: "EUR", F: "EUR", BE: "EUR", V: "EUR", UK: "GBp", US: "USD" };

// Exchange suffix translations to try on stooq when Yahoo fails
const STOOQ_FALLBACKS = { MI: ["DE", "UK"], AS: ["DE", "UK"], L: ["UK"] };

async function stooqFetch(symbol) {
  const [base, exchange] = symbol.split(".");
  const suffixesToTry = exchange ? (STOOQ_FALLBACKS[exchange] || [exchange]) : ["DE", "UK", "US"];
  for (const suffix of suffixesToTry) {
    const stooqSym = `${base}.${suffix}`;
    try {
      const r = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(stooqSym)}&f=sd2t2ohlcv&h&e=csv`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!r.ok) continue;
      const text = await r.text();
      const row = text.split("\n")[1]?.split(",");
      if (!row || row[6] === "N/D" || !row[6]) continue;
      const close = parseFloat(row[6]);
      const open = parseFloat(row[3]) || close;
      if (isNaN(close)) continue;
      const currency = STOOQ_CURRENCY[suffix] || "USD";
      const change24h = open ? ((close - open) / open) * 100 : 0;
      return { price: close, currency, change24h };
    } catch { continue; }
  }
  return null;
}

async function fetchPrice(symbol) {
  const yf = await yfFetch(symbol).catch(() => null);
  if (yf) return yf;
  return stooqFetch(symbol).catch(() => null);
}

app.post("/api/prices", requireAuth, async (req, res) => {
  const { tickers } = req.body; // { [posId]: "NVDA" }
  if (!tickers || typeof tickers !== "object") return res.json({ prices: {} });

  const symbolToIds = {};
  Object.entries(tickers).forEach(([id, sym]) => {
    if (!sym) return;
    if (!symbolToIds[sym]) symbolToIds[sym] = [];
    symbolToIds[sym].push(id);
  });

  const symbols = Object.keys(symbolToIds);
  if (!symbols.length) return res.json({ prices: {} });

  // Separate crypto from stock/ETF
  const cryptoSymbols = symbols.filter(s => CRYPTO_IDS[s.replace(/-EUR$/, "")]);
  const stockSymbols  = symbols.filter(s => !cryptoSymbols.includes(s));

  const rawPrices = {}; // symbol → { priceEur, change24h }

  // Crypto via CoinGecko (returns EUR directly)
  if (cryptoSymbols.length) {
    const ids = [...new Set(cryptoSymbols.map(s => CRYPTO_IDS[s.replace(/-EUR$/, "")]).filter(Boolean))];
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=eur&include_24hr_change=true`, { headers: { Accept: "application/json" } });
      const data = await r.json();
      cryptoSymbols.forEach(sym => {
        const base = sym.replace(/-EUR$/, "");
        const cgId = CRYPTO_IDS[base];
        if (data[cgId]) rawPrices[sym] = { priceEur: data[cgId].eur, change24h: data[cgId].eur_24h_change || 0 };
      });
    } catch (e) { console.error("CoinGecko error:", e.message); }
  }

  // EUR/USD for stock conversion
  let eurUsd = 1.1;
  if (stockSymbols.length) {
    try { const fx = await yfFetch("EURUSD=X"); if (fx) eurUsd = fx.price; } catch {}
  }

  // Stocks/ETFs via Yahoo Finance with stooq fallback (parallel)
  await Promise.all(stockSymbols.map(async sym => {
    const q = await fetchPrice(sym);
    if (!q) return;
    const priceEur = q.currency === "EUR" ? q.price
      : q.currency === "USD" ? q.price / eurUsd
      : q.currency === "GBp" ? (q.price / 100) * (1 / eurUsd) * 0.87  // approx GBX → EUR
      : q.price;
    rawPrices[sym] = { priceEur, change24h: q.change24h };
  }));

  // Map back to position IDs
  const prices = {};
  Object.entries(symbolToIds).forEach(([sym, ids]) => {
    if (rawPrices[sym]) ids.forEach(id => { prices[id] = rawPrices[sym]; });
  });

  res.json({ prices });
});

// ─── HISTORICAL PRICE ─────────────────────────────────────────────────────────
app.post("/api/price-at-date", requireAuth, async (req, res) => {
  const { ticker, date } = req.body; // date: "YYYY-MM-DD"
  if (!ticker || !date) return res.status(400).json({ error: "Missing ticker or date" });

  const dateObj = new Date(date + "T12:00:00Z");
  const period1 = Math.floor(dateObj.getTime() / 1000);
  const period2 = period1 + 7 * 86400; // +7 days to handle weekends/holidays

  const cryptoId = CRYPTO_IDS[ticker.replace(/-EUR$/, "")];

  try {
    if (cryptoId) {
      // CoinGecko historical — crypto trades every day
      const d = dateObj.getUTCDate(), m = dateObj.getUTCMonth() + 1, y = dateObj.getUTCFullYear();
      const cgDate = `${String(d).padStart(2,"0")}-${String(m).padStart(2,"0")}-${y}`;
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/history?date=${cgDate}&localization=false`, {
        headers: { Accept: "application/json" },
      });
      const data = await r.json();
      const priceEur = data?.market_data?.current_price?.eur;
      if (!priceEur) return res.status(404).json({ error: "No price found for that date" });
      return res.json({ priceEur });
    }

    // Yahoo Finance historical chart (no stooq fallback for historical — stooq historical is unreliable)
    let eurUsd = 1.1;
    try { const fx = await yfFetch("EURUSD=X"); if (fx) eurUsd = fx.price; } catch {}

    // Try the given ticker first, then stooq exchange variants
    let price = null, currency = null;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&period1=${period1}&period2=${period2}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } });
    if (r.ok) {
      const d = await r.json();
      const result = d?.chart?.result?.[0];
      price = result?.indicators?.quote?.[0]?.close?.find(c => c != null) ?? null;
      currency = result?.meta?.currency ?? null;
    }

    // Fallback: try alternative exchange suffixes on Yahoo
    if (!price) {
      const [base, exchange] = ticker.split(".");
      const alts = STOOQ_FALLBACKS[exchange] || [];
      for (const alt of alts) {
        const altTicker = `${base}.${alt === "UK" ? "L" : alt}`; // stooq .UK = Yahoo .L
        const altUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(altTicker)}?interval=1d&period1=${period1}&period2=${period2}`;
        try {
          const ar = await fetch(altUrl, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } });
          if (!ar.ok) continue;
          const ad = await ar.json();
          const aresult = ad?.chart?.result?.[0];
          const ap = aresult?.indicators?.quote?.[0]?.close?.find(c => c != null);
          if (ap) { price = ap; currency = aresult?.meta?.currency; break; }
        } catch { continue; }
      }
    }

    if (!price) return res.status(404).json({ error: "No price data for that date" });

    const gbpEur = 1 / eurUsd * 0.87;
    const priceEur = currency === "EUR" ? price
      : currency === "USD" ? price / eurUsd
      : currency === "GBp" ? (price / 100) * gbpEur
      : currency === "GBP" ? price * gbpEur
      : price / eurUsd; // assume USD as last resort

    res.json({ priceEur });
  } catch (e) {
    console.error("price-at-date error:", e);
    res.status(500).json({ error: "Price lookup failed" });
  }
});

// ─── STATIC CLIENT ────────────────────────────────────────────────────────────
const clientDist = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
} else {
  app.get("/", (_req, res) => res.send("Run: npm run build"));
}

app.listen(PORT, () =>
  console.log(`Portfolio Advisor · port ${PORT} · model: ${AI_MODEL}`)
);
