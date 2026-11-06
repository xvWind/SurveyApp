# Classroom Survey Web Application

A lightweight, mobile-first web application designed for instructors to quickly assess student understanding during lectures via QR codes. Students scan the code and answer questions directly from their phones without creating an account or logging in.

---

## Key Features

- **Anonymous Student Participation**: No account or login required. Single-column, mobile-friendly interface with large touch targets.
- **Projector Presentation Mode**: Displays large QR codes, direct URL fallback, live response counts, and PNG download for lecture slides.
- **Instructor Dashboard**: Comprehensive survey management (Create, Edit, Activate, Close, Duplicate, Archive, and Delete).
- **Single Active Survey Enforcement**: Database constraints and atomic RPC functions guarantee only one survey is active at any time.
- **Duplicate Prevention**: Anonymous browser tokens prevent multiple submissions per survey from the same device.
- **Real-Time Visualizations**: Recharts-powered bar charts displaying counts and percentages.
- **CSV Data Export**: One-click RFC 4180 compliant CSV export for spreadsheet analysis.
- **Dual-Mode Backend**: Runs fully locally with a mock storage layer out-of-the-box, or connects to PostgreSQL via Supabase with Row Level Security (RLS) and stored procedures.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Routing**: React Router v6
- **Charts & QR Codes**: Recharts, `qrcode`
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL 15+, Auth, Row-Level Security, RPC Functions)
- **Hosting**: Cloudflare Pages (Static SPA with `_redirects` routing)

---

## Repository Structure

```text
SurveyApp/
├── public/
│   └── _redirects              # Cloudflare Pages SPA rewrite rule
├── src/
│   ├── components/             # Reusable UI (Navbar, ProtectedRoute)
│   ├── context/                # Authentication context (Supabase + Local Demo)
│   ├── lib/                    # Supabase client & DataService layer
│   ├── pages/                  # Landing, Login, Dashboard, Editor, Present, Student, Results
│   ├── types/                  # TypeScript interfaces and database models
│   ├── App.tsx                 # Application router
│   ├── main.tsx                # Entry point
│   └── index.css               # Tailwind CSS styles
├── supabase/
│   ├── migrations/
│   │   └── 20261105000000_initial_schema.sql # Versioned migration
│   ├── schema.sql              # Complete idempotent SQL schema & RPC functions
│   └── seed.sql                # Sample mock surveys and responses
├── API.md                      # API specification
├── DATABASE.md                 # Database design & schema specification
├── Classroom_Survey_Web_App_Specification.md # High-level product specification
├── UI.md                       # UI & UX specifications
├── TODO.md                     # Phased roadmap with completed tasks
├── package.json
└── README.md
```

---

## Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally (Stand-alone Demo Mode)
The application comes pre-configured with a complete mock database layer. You can immediately launch the app without configuring any external services:

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser:
- **Instructor Dashboard**: Visit `/dashboard` or log in at `/login` (pre-filled demo credentials).
- **Presentation Mode**: Click **Present** on the active survey to see the QR code.
- **Student View**: Open `/s/rec101` (or scan the QR code) to answer the survey as a student.

---

## Supabase Production Setup

To connect the application to a live Supabase PostgreSQL backend:

### 1. Create a Supabase Project
1. Go to [database.new](https://database.new) and create a free project.
2. In the Supabase Dashboard, open the **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and run the script. This creates:
   - Tables (`surveys`, `questions`, `choices`, `responses`, `answers`).
   - Indexes and constraints (including single-active-survey enforcement).
   - Row-Level Security (RLS) policies protecting survey data.
   - Atomic stored procedures (`activate_survey`, `close_survey`, `submit_survey_response`).
4. (Optional) Run `supabase/seed.sql` to populate sample questions and choices.

### 2. Configure Environment Variables
Create a `.env` file in the project root (copied from `.env.example`):

```bash
cp .env.example .env
```

Set your Supabase credentials found in **Project Settings > API**:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Create an Instructor Account
In your Supabase Dashboard under **Authentication > Users**, add an instructor email and password, or use email sign-up.

---

## Deployment to Cloudflare Pages

The application is optimized for free static hosting on **Cloudflare Pages**:

### Option A: Via GitHub Integration (Recommended)
1. Push this repository to GitHub.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), navigate to **Workers & Pages > Create application > Pages > Connect to Git**.
3. Select your repository and configure build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Save and Deploy**. SPA routing is handled automatically by `public/_redirects`.

### Option B: Direct Upload via Wrangler CLI
```bash
npm run build
npx wrangler pages deploy dist --project-name classroom-survey
```

---

## Application Routes

| Path | Description | Access |
|---|---|---|
| `/` | Landing page explaining the application | Public |
| `/login` | Instructor login page | Public |
| `/dashboard` | Instructor dashboard to manage surveys | Authenticated |
| `/surveys/new` | Create a new in-class survey | Authenticated |
| `/surveys/:id/edit` | Edit draft/closed surveys | Authenticated |
| `/surveys/:id/present` | Projector view with large QR code and live counter | Authenticated |
| `/surveys/:id/results` | Aggregated response charts and CSV export | Authenticated |
| `/s/:slug` | Student mobile submission view | Public (Anonymous) |

---

## Verification & Testing

To verify build integrity and TypeScript typings:
```bash
npm run build
```
Build output will be bundled cleanly into `dist/`.
