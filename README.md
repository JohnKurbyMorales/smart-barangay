# SMART-Barangay 🏛️
**AI-Enhanced Barangay Incident Reporting & Monitoring System**

A production-ready full-stack web application with AI-powered incident classification, GIS mapping, real-time notifications, and role-based dashboards.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor** and run `supabase/migrations/001_init_schema.sql`
3. Copy your project URL and keys

### 3. Configure environment variables
Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your-openai-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| AI | OpenAI GPT-4o-mini |
| Maps | Leaflet.js + ESRI Satellite |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register, Forgot/Reset Password
│   ├── (dashboard)/     # Main app pages (protected)
│   ├── admin/           # Admin-only pages
│   └── api/             # API routes (AI, export)
├── components/
│   ├── layout/          # Sidebar, Header
│   ├── maps/            # Leaflet map components
│   ├── shared/          # Reusable badges, cards
│   └── ui/              # shadcn components
├── hooks/               # use-user, use-realtime, use-notifications
├── lib/
│   ├── ai/              # OpenAI classify, chat
│   ├── supabase/        # Client, server, middleware
│   └── validations/     # Zod schemas
└── types/               # TypeScript interfaces
```

---

## 🔐 User Roles

| Role | Capabilities |
|------|-------------|
| **Resident** | Submit reports, view own reports, AI assistant, announcements |
| **Staff** | All resident features + manage/update all reports |
| **Admin** | All features + user management, settings, audit logs |

To make a user admin, update their role in Supabase:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🤖 AI Features

- **Incident Classification** — auto-detects category, severity, priority, and responsible department
- **AI Summary** — generates a concise summary of each incident
- **Keyword Extraction** — pulls relevant keywords for searchability
- **AI Chat Assistant** — answers questions about barangay services

Requires a valid `OPENAI_API_KEY`. Falls back gracefully if AI is unavailable.

---

## 🗺️ Map Features

- Street view (OpenStreetMap) and Satellite view (ESRI World Imagery)
- Color-coded markers per incident category
- Click-to-place location picker when submitting reports
- "Use My Location" button via browser geolocation

---

## 🚀 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add the same environment variables in your Vercel project settings.

---

## 📊 Database

The full SQL schema is in `supabase/migrations/001_init_schema.sql`. It includes:
- Row Level Security (RLS) policies
- Auto-create profile on signup trigger
- PostGIS for geographic queries
- Storage buckets for images/videos/documents
- Realtime subscriptions on key tables
