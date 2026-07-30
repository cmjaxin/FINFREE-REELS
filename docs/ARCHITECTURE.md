# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    NEO Reels Platform                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐              ┌──────────────────┐
│  Admin Web App   │              │  Officer Mobile  │
│  (Next.js)       │              │  (React Native)  │
│  localhost:3000  │              │  Expo            │
└────────┬─────────┘              └────────┬─────────┘
         │                                  │
         └──────────────────┬───────────────┘
                            │
                     ┌──────▼──────┐
                     │ Supabase    │
                     │ (Auth+DB)   │
                     └──────┬──────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼────┐      ┌──────▼──────┐   ┌──────▼──────┐
    │ Storage │      │ PostgreSQL  │   │ Auth        │
    │         │      │             │   │             │
    │ Buckets:│      │ Tables:     │   │ Users       │
    │ -head   │      │ -companies  │   │ Sessions    │
    │  shots  │      │ -users      │   │ Tokens      │
    │ -clips  │      │ -scripts    │   │             │
    │ -videos │      │ -scenes     │   │             │
    │         │      │ -videos     │   │             │
    └────────┘      │ -clips      │   └─────────────┘
                    │ -render_    │
                    │  jobs       │
                    └─────────────┘
```

## Data Flow

### Recording Flow (Officer App)

```
Write Script
    ↓
Record Scenes (1 scene = 1 clip)
    ├─ Clip 1 uploaded to storage
    ├─ Clip 2 uploaded to storage
    └─ Clip N uploaded to storage
    ↓
Trigger Render Job
    ├─ POST to /api/videos/:id/render
    ├─ Creates Shotstack job
    └─ Stores job_id in render_jobs table
    ↓
Poll Render Status (every 2 sec)
    ├─ GET /api/videos/:id/render
    ├─ Checks Shotstack API
    └─ Updates video status
    ↓
Download Finished Video
    └─ File available in rendered-videos bucket
```

### Admin Flow

```
Dashboard
    ├─ Live stats from videos table
    ├─ Adoption gaps from users table
    ├─ Render queue from render_jobs table
    ↓
Users Page
    ├─ List users from users table
    ├─ Edit user (update DB + refresh headshot in Storage)
    ├─ View headshots from storage/headshots
    ↓
Scripts Page
    ├─ List scripts + scenes from DB
    ├─ Assign scripts to officers (script_assignments table)
    ├─ Edit scenes (update DB)
    ↓
Videos Page
    ├─ List videos with status
    ├─ Download from rendered-videos bucket
    ├─ View render job details
```

## Database Schema

### Core Tables

**companies**
- Single tenant for MVP (NEO Home Loans only)
- Branding settings (colors, logo, end-card template)

**users**
- Admin + Loan Officers
- Roles: admin, loan_officer
- Status: active, idle, invited
- Headshots stored in Supabase Storage

**scripts**
- Scene-based scripts
- Author can be admin or officer
- Status: draft, live, archived
- Contains ordered list of scenes

**scenes**
- Belong to scripts
- Kind: hook, body, cta
- Text + metadata (duration, words)

**videos**
- Output per user + script
- Stores final rendered file
- Status tracking: awaiting_scenes → uploading → rendering → ready → needs_review

**video_clips**
- Raw scene recordings
- One clip per scene per take
- Stored in video-clips bucket

**render_jobs**
- Pipeline status
- Stages: uploading → trimming → stitching → normalizing → end_card → complete
- Shotstack job ID tracking

### Auth

- Firebase Auth via Supabase
- Email + password
- Auto-confirm enabled for MVP (disable in production)

## API Endpoints (Future)

### Officer App

**Scripts**
- `POST /api/scripts` — Create self-authored script
- `GET /api/scripts` — Get assigned + own scripts
- `GET /api/scripts/:id` — Get script + scenes

**Videos**
- `POST /api/videos` — Create video for script
- `POST /api/videos/:id/clips` — Upload scene clip
- `POST /api/videos/:id/render` — Trigger Shotstack render
- `GET /api/videos/:id/render` — Poll render status
- `GET /api/videos/:id/download` — Get download URL

**User**
- `GET /api/user` — Get current user profile
- `PUT /api/user` — Update profile

### Admin App

**Users**
- `GET /api/users` — List users (paginated)
- `GET /api/users/:id` — Get user + stats
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Soft delete
- `POST /api/users/:id/invite` — Send invite

**Scripts**
- `GET /api/scripts` — List scripts
- `POST /api/scripts` — Create script
- `PUT /api/scripts/:id` — Update script
- `POST /api/scripts/:id/assign` — Assign to officers
- `POST /api/scripts/:id/publish` — Go live

**Videos**
- `GET /api/videos` — List videos (filterable)
- `GET /api/videos/:id` — Get video + render details
- `POST /api/videos/:id/re-render` — Restart render

**Branding**
- `GET /api/branding` — Get company branding
- `PUT /api/branding` — Update colors, template, hold time

## Deployment Architecture

### Admin Web (Vercel)

```
GitHub → Vercel → Next.js → CDN
         ↓
      .env (secrets)
      ↓
   Supabase API
```

**Deployment:**
```bash
git push origin main
# Vercel auto-deploys
```

### Officer App (EAS)

```
GitHub → EAS Build → iOS/Android APK/IPA
   ↓
   Build server
   ├─ Install dependencies
   ├─ Compile native code
   └─ Sign & release
   ↓
App Store / Play Store (manual)
```

**Deployment:**
```bash
eas build --platform ios
eas build --platform android
eas submit --platform ios
eas submit --platform android
```

## Security Considerations

### Current (MVP)

- Public anon key only (read/write within RLS policies)
- Email auth only
- Row-level security enabled on all tables
- HTTPS only
- Headshots/clips in private storage buckets

### Production (Future)

- Enable email confirmation
- Rate limiting on auth endpoints
- API key rotation
- Audit logging
- HIPAA/compliance checks
- Two-factor auth for admins
- Encrypted storage for sensitive data

## Scaling Considerations

### Storage

Current plan: Supabase Storage
- Free tier: 1GB
- Upgrade to per-project pricing as needed

For high volume: Consider S3 + CloudFront

### Database

Current plan: Supabase PostgreSQL
- Free tier: 500MB
- Upgrade to larger plans as needed

For high volume: Connection pooling, read replicas

### Video Processing

Current plan: Shotstack (hosted)
- Free tier: 50 renders/month
- Pay-as-you-go after

Alternative: Self-hosted FFmpeg on Lambda/Vercel Functions (cheaper at scale)

### Real-time

Current plan: Long polling on render jobs
- Upgrade to Supabase Realtime when needed

## Error Handling

### Offline Scenarios

Officer app:
- Queue uploads when offline
- Sync when connection restored
- Graceful degradation (show cached data)

### Failed Renders

- Retry logic (exponential backoff)
- User notification
- Admin dashboard alerts
- Detailed error logs in render_jobs table

### Auth Failures

- Token refresh on 401
- Silent re-auth if possible
- Force login if session expired
- Clear instructions for user

---

**Last updated:** 2026-07-30
**Maintained by:** Colin Jenson
