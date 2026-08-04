# Splice: Video Content Platform for Loan Officers

![Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![Version](https://img.shields.io/badge/Version-1.0.0-blue) ![License](https://img.shields.io/badge/License-Proprietary-blue)

**Splice** is a complete, production-ready video platform that enables loan officers to record short, branded videos in 3 scenes (Hook, Body, CTA) that are automatically stitched together, branded with their contact info, and rendered as professional MP4s.

## 🎬 What's Included

This is a **complete, ready-to-deploy system** with:

- ✅ **Admin Dashboard** (Next.js) - Create users & scripts, view videos, toggle publish status
- ✅ **Officer App** (React/Web) - Login, record 3 scenes, upload clips, trigger renders
- ✅ **Backend APIs** - User CRUD, script management, video rendering pipeline
- ✅ **Database** - Complete PostgreSQL schema (Supabase)
- ✅ **Video Rendering** - Shotstack integration for final video output
- ✅ **Branding** - Hardcoded logo, disclaimer, officer contact info on end card
- ✅ **Documentation** - Full developer guide + project overview
- ✅ **Deployment Ready** - Deploy to Vercel in 5 minutes

## 🚀 Quick Start (10 minutes)

### 1. Clone & Install
```bash
git clone https://github.com/cmjaxin/FINFREE-REELS.git
cd neo-reels

# Admin dashboard
cd admin && npm install && npm run dev
# → http://localhost:3000

# Officer app (in another terminal)
cd officer && npm install && npm run start
# → Scan QR with Expo Go
```

### 2. Set Environment Variables

**`admin/.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SHOTSTACK_API_KEY=your-shotstack-key
SHOTSTACK_API_URL=https://api.shotstack.io/edit/v1/render
```

**`officer/.env.local`:**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get credentials from:**
- [Supabase](https://supabase.com) (free tier: SQL + Auth + Storage)
- [Shotstack](https://shotstack.io) (free tier: $0.30/minute, ~$1.50-3 per video)

### 3. Deploy to Vercel

```bash
git push origin main
# Vercel auto-deploys → Add env vars in dashboard
```

## 📁 Project Structure

```
neo-reels/
├── admin/                          # Next.js Admin Dashboard
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── users/page.tsx             ← Manage officers
│   │   │   ├── scripts/page.tsx           ← Create scripts
│   │   │   └── videos/page.tsx            ← Download videos
│   │   └── api/
│   │       ├── users/route.ts             ← User CRUD
│   │       ├── scripts/route.ts           ← Script CRUD
│   │       ├── scripts/[id]/route.ts      ← Update status
│   │       ├── render/route.ts            ← Trigger Shotstack
│   │       └── webhook/shotstack/route.ts ← Render callback
│   └── package.json
│
├── officer/                        # React Officer App
│   ├── screens/
│   │   ├── LoginScreen.tsx                ← Email/password login
│   │   ├── RecordingScreen.tsx            ← Record 3 scenes
│   │   └── SettingsScreen.tsx             ← Password mgmt
│   ├── context/
│   │   └── AuthContext.tsx                ← Auth state
│   ├── App.tsx
│   ├── index.js                           ← Entry point
│   └── package.json
│
├── docs/
│   └── supabase-schema.sql                ← Full DB schema
│
├── PROJECT_DOCUMENTATION.md               ← Overview + features
├── DEVELOPER_GUIDE.md                     ← Implementation guide
└── README.md                              ← This file
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Admin** | Next.js 14, TypeScript, Tailwind CSS |
| **Officer** | React, Expo (Web), TypeScript |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage (S3) |
| **Video Rendering** | Shotstack API |
| **Deployment** | Vercel |

## 🎥 How It Works

```
1. Admin Dashboard
   ├─ Add officer: name, email, password, phone, NMLS, title
   ├─ Auto-creates Supabase auth account
   └─ Officer can login

2. Admin creates Script
   ├─ Define 3 scenes: Hook (30s), Body (60s), CTA (15s)
   ├─ Add guidance text for each scene
   └─ Toggle status: Draft → Live

3. Officer Records
   ├─ Login with email/password
   ├─ See available "Live" scripts
   ├─ Select script → Record Scene 1
   ├─ Upload to Supabase storage
   ├─ Repeat for Scene 2 & 3
   └─ Click "Render"

4. Shotstack Renders
   ├─ Stitches 3 clips together
   ├─ Adds end card: logo + name + title + NMLS + phone + email + disclaimer
   ├─ Exports MP4
   └─ Calls webhook → Updates video status to "ready"

5. Admin Downloads
   ├─ Videos page shows "ready"
   └─ Download final MP4
```

## 📡 API Endpoints

### Users
```
POST   /api/users              Create officer (auto auth)
GET    /api/users              List all officers
```

### Scripts
```
POST   /api/scripts            Create script with 3 scenes
GET    /api/scripts            List scripts
PUT    /api/scripts/[id]       Update status (draft/live)
```

### Videos
```
GET    /api/videos?status=ready List videos (optional filter)
POST   /api/render              Trigger Shotstack render
```

### Webhooks
```
POST   /api/webhook/shotstack   Receive render completion
```

## 🗄️ Database Schema

**Key Tables:**
- `users` — Officers: email, name, phone, NMLS, title, auth_id
- `scripts` — Scripts: title, slug, status (draft/live/archived)
- `scenes` — Scenes: kind (hook/body/cta), text, duration, order
- `videos` — Videos: status (recording/rendering/ready/error), file_url
- `video_clips` — Raw clips: clip_url, duration, scene_id

**Storage:**
- `video-clips` — Raw scene recordings (auto-deleted 24h after render)
- `rendered-videos` — Final MP4 files

## 🎨 Branding

Currently **hardcoded** in `/admin/app/api/render/route.ts`:

```typescript
const branding = {
  logo_url: 'https://8blocks.s3-us-west-1.amazonaws.com/neo/images/logo.png',
  disclaimer_text: '© 2026 Better Home & Finance Holding Company...',
  end_card_text_color: '#FFFFFF',
  disclaimer_text_color: '#999999',
  end_card_hold_seconds: 3,
}
```

**To customize:** Edit the branding object, redeploy.

## 🚀 Deployment

### Admin Dashboard to Vercel
```bash
git add .
git commit -m "Deploy"
git push origin main
# Vercel auto-deploys when connected to repo
# Set env vars in Vercel dashboard
```

### Officer App to Vercel (Web)
```bash
cd officer
vercel deploy
```

### Officer App to TestFlight (iOS)
```bash
cd officer
eas build --platform ios --profile production
# Upload to App Store Connect → TestFlight
# Share link with officers
```

## ✅ Testing

### Manual Test (End-to-End)
1. **Admin:** Create officer "John" (john@company.com, Test123!)
2. **Admin:** Create script "Refinance Benefits" (3 scenes)
3. **Admin:** Toggle script to "Live"
4. **Officer:** Login as John
5. **Officer:** See script → Record 3 scenes → Render
6. **Shotstack:** Render for 5-10 min
7. **Admin:** Videos page shows "ready" → Download MP4
8. **Verify:** Video has logo + officer info + all 3 scenes

### API Test
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test","password":"Test123!"}'
```

## 📚 Documentation

| File | Purpose |
|------|---------|
| **README.md** | This file - quick start + reference |
| **PROJECT_DOCUMENTATION.md** | Overview, features, architecture |
| **DEVELOPER_GUIDE.md** | Full implementation guide with code samples |
| **docs/supabase-schema.sql** | Complete database schema |

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot resolve entry file" | Create `/officer/index.js` (see DEVELOPER_GUIDE.md) |
| RLS errors | Run: `ALTER TABLE users DISABLE ROW LEVEL SECURITY;` |
| Shotstack fails | Check: clips uploaded, API key valid, URL accessible |
| Can't login | Verify: user in Supabase Auth + database |

See **DEVELOPER_GUIDE.md** for detailed troubleshooting.

## 🔮 Future Features (Phase 2+)

- [ ] Admin branding dashboard (DB-driven)
- [ ] Script assignment (assign to specific officers)
- [ ] Video templates (multiple end card designs)
- [ ] Analytics dashboard
- [ ] Offline recording
- [ ] Social media integration
- [ ] CRM integration

## 🔗 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Shotstack API](https://shotstack.io/docs/api-reference/)
- [Next.js Docs](https://nextjs.org/docs)
- [Expo Docs](https://docs.expo.dev)
- [Vercel Docs](https://vercel.com/docs)

## 📝 License

Proprietary - All rights reserved.

## 📧 Support

**Project Lead:** Colin Jenson (Colin.jenson@neohomeloans.com)  
**GitHub:** https://github.com/cmjaxin/FINFREE-REELS  
**Vercel:** https://finfree-reels.vercel.app

---

**Status:** Production Ready ✅ | **Version:** 1.0.0 | **Updated:** August 4, 2026

**Start here:** Read **DEVELOPER_GUIDE.md** for complete implementation walkthrough
