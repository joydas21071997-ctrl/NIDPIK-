# NIDPIK - Find, Compare & Pick Right

> **India's Honest Product Discovery, Buying Guides & Smart Value Picks (Starting from ₹99)**

NIDPIK is a full-stack editorial discovery and affiliate portal built specifically for Indian shoppers. It helps consumers navigate budget picks, problem-solution collections, in-depth verified reviews, head-to-head comparisons, and AI-grounded buying recommendations.

---

## 🌟 Key Highlights & Features

- **AI Buying Advisor:** Instant personalized product recommendations grounded in tested picks with max budget filters (Powered by Google Gemini 3.8 Flash with offline heuristic fallback).
- **Price Tracker & Drop Alert:** Track historical price trends and receive instant email notifications when prices drop below target levels.
- **Community User Reviews:** Authenticated 5-star ratings, buyer feedback, and editorial testing scores.
- **Budget Tier Hubs:** Dedicated hubs starting from Under ₹99, ₹299, ₹499, ₹999, to ₹1,999.
- **Full-Featured Admin CMS (`/admin`):**
  - Role-based permissions (`OWNER`, `ADMIN`, `EDITOR`).
  - Product catalog CRUD, Buying Guides & Reviews editor, Category manager, Merchant links & Outbound affiliate click tracking.
  - Media library, Author bios, and SEO meta configuration.
- **SEO & Google Search Ready:** Automatic dynamic `/sitemap.xml`, `/robots.txt`, Schema.org Product & Review JSON-LD structured data.

---

## 🚀 Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend:** Express.js, TypeScript (`tsx`), SQLite via Node.js `node:sqlite` (WAL Mode).
- **AI Engine:** `@google/genai` (Gemini 3.8 Flash).
- **Deployment:** Firebase Hosting, Google Cloud Run / Docker, or Node.js server.

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-username/nidpik.git
cd nidpik

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Default Admin Accounts

- **Owner:** `admin@nidpik.in` | Password: `admin` (or `Nidpik@Admin2026!`)
- **Editor:** `editor@nidpik.in` | Password: `editor` (or `Nidpik@Editor2026!`)
- **Manager:** `manager@nidpik.in` | Password: `manager` (or `Nidpik@Manager2026!`)

---

## 📦 Production Build & Deploy

See [DEPLOY_TO_FIREBASE.md](./DEPLOY_TO_FIREBASE.md) for full instructions on deploying to Firebase and connecting `nidpik.in`.
