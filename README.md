# NEO Reels

A video content platform for NEO Home Loans that enables loan officers to record, edit, and publish branded short-form videos directly from their phones.

## Project Structure

```
neo-reels/
├── admin/           # Next.js web app for company admins
├── officer/         # React Native/Expo app for loan officers
├── docs/            # Design handoff and technical docs
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for admin deployment)
- EAS account (for officer app deployment)

### Admin Web App

```bash
cd admin
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Open http://localhost:3000/login

### Officer Mobile App

```bash
cd officer
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web preview

## Tech Stack

### Admin Web
- **Framework:** Next.js 14 + React 18
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **Hosting:** Vercel

### Officer Mobile
- **Framework:** React Native + Expo
- **Navigation:** React Navigation
- **Camera:** Expo Camera
- **Auth:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **Deployment:** EAS Build

### Backend Services
- **Auth & DB:** Supabase
- **Video Processing:** Shotstack (render pipeline)
- **File Storage:** Supabase Storage

## Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Project scaffold
- [ ] Supabase schema setup (companies, users, scripts, videos)
- [ ] Admin: User + script CRUD
- [ ] Officer: Home screen + compose flow
- [ ] Basic auth flow (both apps)

### Phase 2: Recording & Upload (Weeks 3-4)
- [ ] Officer: Camera recording (scene-by-scene)
- [ ] Officer: Review & retake flow
- [ ] Officer: Upload clips to Supabase Storage
- [ ] Admin: Videos page + basic status tracking

### Phase 3: Render Pipeline (Weeks 5-6)
- [ ] Shotstack integration (stitch clips + end card)
- [ ] Download finished video
- [ ] Render job polling + notifications

### Phase 4: Polish (Weeks 7+)
- [ ] AI script generation (Claude API)
- [ ] End card templates (Split, Centered, Lower band)
- [ ] Compliance scanning (phase 2)
- [ ] Push notifications
- [ ] Analytics dashboard

## Supabase Schema

### Tables
- `companies` — Multi-tenant support (for future)
- `users` — Admin + loan officers, roles, headshots
- `scripts` — Scene-based scripts, authored by admin or officer
- `scenes` — Individual script scenes (kind, text, order)
- `videos` — Rendered output per user+script, one clip per scene
- `render_jobs` — Pipeline status (trim, stitch, normalize, end card)

## API Endpoints

### Officer App
- `POST /api/scripts` — Create script
- `POST /api/videos` — Upload clip
- `POST /api/videos/:id/render` — Trigger render job
- `GET /api/videos/:id/render` — Poll render status
- `GET /api/scripts/:id` — Fetch script

### Admin App
- `GET /api/users` — List users
- `PUT /api/users/:id` — Update user
- `GET /api/scripts` — List scripts
- `POST /api/scripts` — Create script
- `PUT /api/scripts/:id` — Update script
- `GET /api/videos` — List videos

## Deployment

### Admin Web (Vercel)

```bash
cd admin
vercel deploy
```

### Officer App (EAS)

```bash
cd officer
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

## Environment Variables

### Admin (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Officer (.env.local)
```
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Design Tokens

See `design_handoff_neo_video_platform/` for:
- Color palette (navy, cyan, semantic colors)
- Typography (Barlow + IBM Plex Mono)
- Spacing & radii
- Motion (fade, rise, slide, pulse, spin)

All colors and tokens are configured in `admin/tailwind.config.js`.

## Contributing

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Make your changes
3. Commit with clear messages
4. Push and open a PR

## Support

Contact: Colin Jenson (Colin.jenson@neohomeloans.com)

---

**Status:** MVP in development
**Next Milestone:** Phase 1 complete (Supabase schema + basic CRUD)
