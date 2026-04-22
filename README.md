# TrackR — Job Application Tracker

![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

A full-stack, single-page web app for managing your job search pipeline — with real-time stats, bulk actions, undo/redo history, multi-currency salary display, and secure authentication. Free to self-host. I built this app out of my own experiences in job hunting, acknowledging that such tool would be useful to keep track of the roles I applied for and having data like so available meant I could analyse what I could improve in from that.

---

## Features

| | Feature | Description |
|---|---|---|
| 📊 | **Live stats** | Counters for total applications, response rate, interview count, and offers — updated in real time. |
| ➕ | **Application logging** | Modal form for company, role, salary, status, date, URL, and notes. |
| 🔍 | **Search & filter** | Full-text search across company and role fields; one-click status filtering. |
| ↕️ | **Sorting** | Sort by most recent, salary (descending), or company name (alphabetical). |
| ☑️ | **Bulk actions** | Select multiple applications to update status, append notes, or delete in one go. |
| ↩️ | **Undo / Redo** | Session-scoped history stack. `Ctrl+Z` / `⌘Z` to undo; `Ctrl+Shift+Z` / `⌘⇧Z` to redo. |
| 🗑️ | **Trash & restore** | Deleted applications are recoverable from a trash bin before permanent deletion. |
| 💱 | **Multi-currency** | Display salaries in GBP, USD, CAD, AUD, EUR, or BRL. Preference persisted to `localStorage`. |
| 🔒 | **Google OAuth** | One-click sign-in via Google using Supabase's PKCE OAuth flow. |
| 🛡️ | **Two-factor auth** | TOTP enrollment (Google Authenticator, Authy, 1Password, etc.) via Settings → Security. |
| 🎓 | **Onboarding tour** | 8-step interactive overlay for new users. Restartable from the avatar menu. |
| 📱 | **Responsive** | Mobile-friendly layout with a collapsible activity sidebar. |
| 🌙 | **Dark-first design** | Zinc-950 base with zinc-800/700 borders. |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + TypeScript | UI rendering, hooks-based state management |
| Styling | Tailwind CSS v3 | Utility-first dark theme |
| Auth | Supabase Auth | Email/password, Google OAuth (PKCE), TOTP MFA |
| Database | Supabase (PostgreSQL) | Row Level Security for per-user data isolation |
| Realtime | Supabase Realtime | Live subscription to row changes |
| Notifications | react-hot-toast | Non-intrusive toast messages |
| Routing | React Router v6 | SPA routing with protected route guard |
| Build | Vite | Fast HMR dev server and optimised production build |

---

## Project Structure

```
src/
├── components/
│   └── dashboard/
│       ├── Atoms.tsx               # StatCard and other primitive components
│       ├── ApplicationsTable.tsx   # Main data table with inline editing
│       ├── AddApplicationModal.tsx
│       ├── SettingsModal.tsx       # Profile, Security (2FA), Preferences, Trash
│       ├── Sidebar.tsx             # Activity feed + pipeline chart
│       └── TourOverlay.tsx         # Onboarding tooltip tour
├── hooks/
│   ├── useAuth.ts          # Auth state, Google OAuth, TOTP MFA, currency
│   ├── useApplications.ts  # CRUD operations against Supabase
│   ├── useHistory.ts       # Undo/redo history stack
│   ├── useTrash.ts         # Client-side trash bin
│   └── useTour.ts          # Tour step state machine
├── lib/
│   └── supabase.ts         # Supabase client singleton
├── pages/
│   ├── Dashboard.tsx       # Main application shell
│   ├── AuthPage.tsx        # Sign in / sign up / MFA verification
│   └── AuthCallback.tsx    # Google OAuth PKCE redirect handler
└── types/
    └── types.ts            # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier is sufficient)
- A Google Cloud project (for Google OAuth — free)

### Installation

```bash
git clone https://github.com/your-username/trackr.git
cd trackr
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are available in your Supabase dashboard under **Project Settings → API**.

### Run the Dev Server

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

---

## Supabase Setup

### 1. Create the Database Table

Run the following in your Supabase **SQL Editor**:

```sql
create table public.applications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  company    text not null,
  role       text not null,
  salary     text not null default '',
  status     text not null default 'Applied',
  applied    timestamptz not null default now(),
  notes      text,
  url        text,
  logo       text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.applications enable row level security;

create policy "Users see own rows"    on public.applications for select using (auth.uid() = user_id);
create policy "Users insert own rows" on public.applications for insert with check (auth.uid() = user_id);
create policy "Users update own rows" on public.applications for update using (auth.uid() = user_id);
create policy "Users delete own rows" on public.applications for delete using (auth.uid() = user_id);
```

### 2. Enable Google OAuth

1. In [Google Cloud Console](https://console.cloud.google.com), go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID** (Web application).
2. Add `https://your-project-id.supabase.co/auth/v1/callback` as an authorised redirect URI.
3. Copy the **Client ID** and **Client Secret**.
4. In Supabase: **Authentication → Providers → Google** — enable it and paste the credentials.
5. In Supabase: **Authentication → URL Configuration** — add `http://localhost:5173/auth/callback` (and your production URL).

### 3. Enable TOTP / MFA

Go to **Authentication → Multi-Factor Authentication** and toggle on **Enable TOTP**. TrackR's `useAuth` hook handles enrollment, challenge, and verification automatically.

### 4. Enable Realtime

Go to **Database → Replication** and enable the `applications` table under Sources.

---

## Security Model

- **Row Level Security (RLS):** All queries are filtered server-side using `auth.uid() = user_id`. The frontend anon key cannot access another user's data, even if extracted from the browser bundle.
- **OAuth PKCE flow:** Supabase JS v2 uses PKCE for all OAuth redirects, eliminating the main attack vector of the implicit flow.
- **TOTP MFA:** Enforces Authenticator Assurance Level 2 (AAL2). A stolen password alone is not enough to sign in.
- **No secrets in the frontend:** The anon key is a public JWT. The service role key is never used client-side.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR at `localhost:5173` |
| `npm run build` | Type-check and build an optimised production bundle to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across all TypeScript and TSX files |
| `npm run type-check` | Run `tsc --noEmit` without emitting output |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` / `⌘Z` | Undo last action |
| `Ctrl+Shift+Z` / `⌘⇧Z` | Redo |
| `Ctrl+Y` / `⌘Y` | Redo (alternative) |

---

## Deployment

**Vercel (recommended):** Import the repo at [vercel.com/new](https://vercel.com/new), set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables, and deploy. Vite is auto-detected — no build configuration needed.

**Other providers:** TrackR is a static SPA with no server component. It deploys to any static host (Netlify, Cloudflare Pages, GitHub Pages, AWS S3 + CloudFront, etc.). The build output is the `dist/` folder. Ensure your host serves `index.html` for all routes (SPA fallback). Remember to add your production URL to Supabase → **Authentication → URL Configuration → Redirect URLs**.

---

## Extending TrackR

- **New status values:** Add entries to the `STATUSES` array in `Dashboard.tsx`. The filter dropdown, bulk-status picker, and stats calculation update automatically. No database migration needed.
- **New currencies:** Append an entry to the `CURRENCY_META` object in `useAuth.ts` with its ISO code, symbol, label, and flag emoji.

---

### Why TrackR was built in such way

TrackR's stack is React, Typescript and Supabase. I opted for this stack specifically because, first off, React is my main frontend framework, secondly, Supabase handles the backend affairs such as auth and RLS seamlessly and Typescript is basically a must in such projects to ensure type safety, although not strictly necessary, it is highly recommended for that matter. Some things that stand out with TrackR:

- **Optimistic UI:** TrackR features optimistic UI with toast on errors, which basically means it gives instant feedback after an action that would otherwise delay the display for a little bit. This decision has been made to enhance user experience as much as possible since I identified that delay as potentially problematic. However, the toast element showing errors on events is as important since it prevents the "silent failures" types of mutations which is potentially worse than a delay.
- **Safety measures:** RLS, Google Auth, Supabase Handling, PKCE and TOTP two-factor authentication. Those are some of the measures I took to ensure the safety of data in TrackR. RLS policies ensure that users can only interact with data that match the criteria mentioned in the policy rather than the whole table. Google OAuth is one way that TrackR handles authentication, this process includes a flow called PKCE (Proof Key for Code Exchange) which basically ensures that the token is not intercepted by making sure that the app exchanging the authorization code is the same as the one that requested, then the token is issued. 

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Keep commits small and descriptive using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`).
3. Run `npm run lint` and `npm run type-check` before pushing. PRs with lint errors will not be merged.
4. Open a pull request against `main` with a clear description of the change.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute for personal or commercial purposes.

---

*Built with ♥ for job seekers everywhere.*
