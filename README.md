# 🤠 The Homestead — Next.js + Django

> Where habits become bounties and responsibility feels like an adventure

A full-stack gamified habit tracker for families and classrooms, rebuilt with **Next.js 14** (App Router) on the frontend and **Django** on the backend.

---

## 🏗️ Project Structure

```
homestead/
├── backend/                   ← Django API server
│   ├── manage.py
│   ├── requirements.txt
│   └── homestead/
│       ├── settings.py        ← SQLite + CORS config
│       ├── urls.py            ← Root URL routing
│       └── api/
│           ├── models.py      ← Pioneer, Session, Bounty, Claim, Purchase
│           ├── views_auth.py  ← /api/auth/* endpoints
│           ├── views_bounties.py ← /api/bounties/* endpoints
│           ├── views_store.py ← /api/store + /api/leaderboard
│           ├── urls.py        ← API URL patterns
│           └── migrations/    ← Auto-generated DB migrations
│
└── frontend/                  ← Next.js 14 App Router
    ├── next.config.js         ← Proxies /api/* → Django :8000
    ├── tailwind.config.js     ← Wild West theme tokens
    └── src/
        ├── app/
        │   ├── layout.tsx     ← Root layout (AuthProvider)
        │   ├── page.tsx       ← Redirect by role
        │   ├── auth/
        │   │   ├── login/page.tsx
        │   │   └── signup/page.tsx
        │   ├── sheriff/       ← Parent/Teacher views
        │   │   ├── layout.tsx         ← Auth guard (sheriff only)
        │   │   ├── page.tsx           ← Dashboard
        │   │   ├── bounties/page.tsx  ← Post & manage bounties
        │   │   ├── ledger/page.tsx    ← Approve / decline claims
        │   │   └── posse/page.tsx     ← Cowboys leaderboard
        │   └── cowboy/        ← Kid/Student views
        │       ├── layout.tsx         ← Auth guard (cowboy only)
        │       ├── page.tsx           ← Home dashboard
        │       ├── bounties/page.tsx  ← Bounty Board
        │       ├── store/page.tsx     ← General Store
        │       └── profile/page.tsx  ← Stats, titles, badges
        ├── components/
        │   ├── Nav.tsx        ← Sticky top nav (role-aware)
        │   └── BountyCard.tsx ← Wanted-poster card
        └── lib/
            ├── api.ts         ← Typed fetch client
            ├── auth-context.tsx ← React auth context + hooks
            └── titles.ts      ← Title calculation + attribute metadata
```

---

## 🚀 Quick Start

### 1. Backend (Django)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations (creates db.sqlite3)
python manage.py migrate

# Start the API server on port 8000
python manage.py runserver
```

The API will be live at **http://localhost:8000/api/**

### 2. Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server on port 3000
npm run dev
```

Open **http://localhost:3000** in your browser.

> Next.js proxies all `/api/*` requests to Django at `localhost:8000`, so no CORS issues in development.

---

## 👤 Roles

| Role | Access | Route |
|------|--------|-------|
| **Sheriff** (Parent/Teacher) | Post bounties, review claims, view posse stats | `/sheriff/*` |
| **Cowboy** (Kid/Student) | Complete bounties, spend gold, view profile | `/cowboy/*` |

Both sign up at `/auth/signup` and choose their role. The app auto-redirects to the correct dashboard.

---

## 🎯 Features

### Sheriff
- **Dashboard** — overview of cowboys, pending claims, total stats
- **Bounties** — create/edit/delete bounties with schedule types (daily, weekly, monthly, open range)
- **Ledger** — approve or decline pending claim submissions with streak bonus preview
- **Posse** — leaderboard with attribute breakdowns per cowboy

### Cowboy
- **Home** — daily progress bar, attribute summary, grit meter, streak warning
- **Bounty Board** — grouped by schedule type; submit claims for sheriff review
- **General Store** — spend gold on rewards (screen time, choose dinner, stay up late)
- **Profile** — title progression, attribute bars, badges, leaderboard rank

### Streak System
| State | Multiplier |
|-------|-----------|
| Normal | 1× gold |
| 7-day streak (Gold Rush) | 2× gold |
| Missed day (Cracked Grit) | 0.5× gold |
| Cracked Grit rebuild | Complete all bounties 3 days in a row |

### 36 Dynamic Titles
Calculated from dominant attribute + XP tier across 4 categories (Grit, Labor, Wisdom, Honor) with 3 Legend titles for high XP.

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET  | `/api/auth/me` | Current user |
| GET  | `/api/bounties` | List all bounties (with claim status) |
| POST | `/api/bounties` | Create bounty (sheriff) |
| PATCH | `/api/bounties/:id` | Edit bounty (sheriff) |
| DELETE | `/api/bounties/:id` | Remove bounty (sheriff) |
| POST | `/api/bounties/:id/claim` | Submit completion (cowboy) |
| GET  | `/api/bounties/pending-claims` | List pending claims (sheriff) |
| POST | `/api/bounties/:id/approve` | Approve claim + award gold (sheriff) |
| POST | `/api/bounties/:id/decline` | Decline claim (sheriff) |
| GET  | `/api/store` | Get store items + purchase history |
| POST | `/api/store` | Purchase item |
| GET  | `/api/leaderboard` | All pioneers ranked by XP |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS (custom Wild West theme) |
| Fonts | Rye + Special Elite (Google Fonts) |
| Auth state | React Context |
| Backend | Django 4.2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | Session tokens via HTTP-only cookies |
| CORS | django-cors-headers |
