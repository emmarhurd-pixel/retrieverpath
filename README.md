# 🐾 RetrieverPath — UMBC Degree Planner

A full-featured UMBC academic degree planning web app built with React, TypeScript, Supabase, and Vite.

---

## Features

| Page | Description |
|------|-------------|
| **Onboarding** | Select major(s), tracks, minors, certificates, transfer credits, and graduation semester |
| **Dashboard** | Live degree tracker — progress bars per requirement, color-coded courses, prereq display |
| **Courses** | Log completed / in-progress / future courses grouped by semester; transcript OCR upload |
| **Planner** | Semester-by-semester course planning with AI suggestions, difficulty ratings, and scheduling warnings |
| **Study Network** | Join course study groups, post messages, add friends, compare schedules |

### Credit Engine Rules
- Upper division = course number starts with 3 or 4
- Courses only satisfy department requirements when they match that exact department
- No double-counting across categories unless UMBC policy explicitly allows it
- GPA calculated from completed courses only
- Overall progress counts completed required credits only

---

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v3 (UMBC black & gold theme)
- **State**: Zustand (persisted to localStorage)
- **Database / Auth**: Supabase (PostgreSQL + Row Level Security)
- **Hosting**: Vercel (recommended)
- **Icons**: Lucide React

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/retrieverpath.git
cd retrieverpath
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run the entire contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from Project Settings → API

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ Never commit `.env.local` — it is already in `.gitignore`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project from GitHub
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite

---

## Project Structure

```
retrieverpath/
├── supabase/
│   └── schema.sql          # Full Supabase schema + RLS policies
├── src/
│   ├── data/
│   │   ├── programs.ts     # 36 UMBC programs (majors, minors, certs)
│   │   ├── courses.ts      # 236 UMBC courses with prereqs + schedule data
│   │   └── transferCredits.ts  # AP/IB/CLEP mappings
│   ├── lib/
│   │   ├── creditEngine.ts # Credit counting, GPA, upper-div, prereq logic
│   │   └── supabase.ts     # Supabase client + type definitions
│   ├── store/
│   │   └── useStore.ts     # Zustand global store (persisted)
│   ├── types/
│   │   └── index.ts        # All TypeScript interfaces
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── Collapsible.tsx
│   │   ├── Header.tsx
│   │   └── ProgressBar.tsx
│   ├── pages/
│   │   ├── Onboarding.tsx  # 3-screen onboarding flow
│   │   ├── Dashboard.tsx   # Degree tracker
│   │   ├── Courses.tsx     # Course log
│   │   ├── Planner.tsx     # Semester planner
│   │   └── StudyNetwork.tsx# Social / study groups
│   └── App.tsx
├── .env.example            # Template — copy to .env.local
└── tailwind.config.js
```

---

## Adding Real Supabase Auth

The app currently runs fully on local Zustand state so you can test without any backend. To wire up real authentication:

1. Enable Email/Password auth in Supabase Dashboard → Authentication
2. Call `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()` in an Auth component
3. Replace the local store writes with Supabase table inserts/selects
4. RLS policies are already configured in `schema.sql`

---

## License

MIT — built for UMBC students. Go Retrievers! 🐾
