# ⚡ SportyAI — AI-Powered Bet Slip Analyser

> Paste your SportyBet booking code. AI removes the bad eggs. Get a fresh, cleaner code.

Built for SportyBet Nigeria. Powered by Groq AI (Llama 3.3 70B).

---

## What It Does

1. **Paste** your SportyBet booking code
2. **Set** your target odds (e.g. 100, 20, 5)
3. **AI analyses** each game — odds, league, pick type, risk level
4. **Removes** the risky "bad eggs" automatically
5. **Returns** a fresh SportyBet booking code with safer selections

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 + TypeScript |
| AI Analysis | Groq API (Llama 3.3 70B) — Free |
| Backend/Proxy | Next.js API Routes (Vercel Serverless) |
| Auth | JWT + bcrypt |
| Hosting | Vercel — Free |

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/yourusername/sportyai.git
cd sportyai
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
JWT_SECRET=your_random_secret_here
GROQ_API_KEY=your_groq_api_key_here
SPORTYBET_COUNTRY=ng
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourusername/sportyai.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Add Environment Variables:
   - `JWT_SECRET` → any long random string
   - `GROQ_API_KEY` → your Groq API key
   - `SPORTYBET_COUNTRY` → `ng`
4. Click Deploy

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Secret key for JWT tokens — make this long and random |
| `GROQ_API_KEY` | ✅ | Your Groq API key from console.groq.com |
| `SPORTYBET_COUNTRY` | ✅ | Country code — `ng` for Nigeria |

---

## Notes

- User data is stored in a local `data/users.json` file. For production scale, replace `lib/users.ts` with a real database (Supabase, PlanetScale, etc.)
- The SportyBet rebook API (`/api/rebook`) may occasionally fail if SportyBet changes their internal API. The analysis still works even if rebooking fails.
- Groq free tier: 1,000 requests/day. More than enough for personal use.

---

## Project Structure

```
sportyai/
├── pages/
│   ├── index.tsx          # Login/Register page
│   ├── dashboard.tsx      # Main app
│   └── api/
│       ├── auth/
│       │   ├── login.ts
│       │   ├── register.ts
│       │   └── logout.ts
│       ├── decode.ts      # Decode SportyBet booking code
│       ├── analyse.ts     # Groq AI analysis
│       └── rebook.ts      # Generate new booking code
├── lib/
│   ├── auth.ts            # JWT helpers
│   ├── users.ts           # User storage
│   ├── sportybet.ts       # SportyBet API integration
│   └── groq.ts            # Groq AI analysis
├── styles/
│   └── globals.css
└── .env.example
```

---

Made with ⚡ for Nigerian punters
