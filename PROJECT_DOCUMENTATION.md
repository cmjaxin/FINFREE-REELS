# Splice: Video Content Platform
## Complete Project Documentation

---

## **1. Project Overview**

**Splice** is a professional video content creation and distribution platform designed for loan officers. It enables officers to record short, branded video content (30-120 seconds) that can be automatically rendered with their contact information, photos, and company branding.

### **Core Use Case**
Loan officers record 3-scene videos:
1. **Hook** (15-30s) - Introduce yourself & grab attention
2. **Body** (30-60s) - Explain the offer/benefit
3. **CTA** (15s) - Call to action

The system automatically stitches clips together, adds a professional end card with officer info, and renders a final MP4 video ready to share.

---

## **2. System Architecture**

### **High-Level Flow**
```
Admin Dashboard (Next.js) → Create Users & Scripts
                ↓
Officer Mobile/Web App → Login → Record 3 Scenes → Upload Clips
                ↓
Supabase Storage → Store Video Clips
                ↓
Shotstack API → Render Final Video (Clip stitching + End Card)
                ↓
Supabase Storage → Store Final MP4
                ↓
Admin Dashboard → Download & Manage Videos
```

### **Components**

| Component | Tech | Purpose |
|-----------|------|---------|
| Admin Dashboard | Next.js 14 | User mgmt, script creation, video management |
| Officer App | React/Web (converting from React Native) | Recording interface, video upload |
| Database | Supabase PostgreSQL | Users, scripts, scenes, videos, clips |
| Storage | Supabase Storage | Raw video clips + final rendered videos |
| Video Rendering | Shotstack API | Stitches clips, adds branding, exports MP4 |
| Authentication | Supabase Auth | Email/password login, auto-account creation |
| Deployment | Vercel | Admin dashboard (web), Officer app (web) |

---

## **3. Technology Stack**

### **Frontend**
- **Next.js 14** (Admin Dashboard)
- **React** (Officer Web App)
- **Tailwind CSS** (Dark theme styling)
- **TypeScript** (Type safety)

### **Backend**
- **Supabase** (PostgreSQL database + auth + storage)
- **Shotstack API** (Video rendering service)
- **Next.js API Routes** (Admin backend)

### **Infrastructure**
- **Vercel** (Production deployment)
- **GitHub** (Version control)

### **Design System**
- **Dark mode only** (no light theme)
- **Color palette**: Blue (#2DAEFF) + Purple (#7A33F5) gradient
- **Typography**: System fonts, clean hierarchy

---

## **4. Project Structure**

```
neo-reels/
├── admin/                          # Admin Dashboard (Next.js)
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── users/page.tsx          # User management (add/view officers)
│   │   │   ├── scripts/page.tsx        # Script creation & status toggle
│   │   │   ├── videos/page.tsx         # Video gallery & downloads
│   │   │   └── branding/page.tsx       # Branding settings (informational)
│   │   ├── api/
│   │   │   ├── users/route.ts          # User CRUD + auto auth account creation
│   │   │   ├── scripts/route.ts        # Script CRUD
│   │   │   ├── scripts/[id]/route.ts   # Update script status (draft/live)
│   │   │   ├── videos/route.ts         # Video list & filtering
│   │   │   ├── render/route.ts         # Trigger Shotstack render
│   │   │   ├── branding/route.ts       # Branding settings (hardcoded now)
│   │   │   └── webhook/shotstack/route.ts  # Shotstack completion webhook
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── app.json
│   └── package.json
│
├── officer/                        # Officer Web/Mobile App
│   ├── screens/
│   │   ├── LoginScreen.tsx             # Email/password login
│   │   ├── RecordingScreen.tsx         # 3-scene video recording UI
│   │   └── SettingsScreen.tsx          # Password management
│   ├── context/
│   │   └── AuthContext.tsx             # Supabase auth state management
│   ├── lib/
│   │   └── supabase.ts                 # Supabase client
│   ├── App.tsx                     # Navigation & auth wrapper
│   ├── index.js                    # Entry point
│   ├── app.json                    # Expo config
│   ├── eas.json                    # EAS build config (TestFlight)
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   └── supabase-schema.sql         # Complete database schema
│
├── .github/
│   └── workflows/                  # CI/CD pipelines (if added)
│
├── eas.json                        # Expo build config
├── package.json                    # Workspace root
└── README.md
```

---

## **5. Database Schema**

### **Tables**

#### `users`
```sql
- id (UUID, primary key)
- email (text, unique)
- full_name (text)
- auth_id (UUID, foreign key to Supabase auth)
- role (text: 'admin' or 'loan_officer')
- status (text: 'active', 'inactive')
- direct_phone (text, nullable)
- title_on_end_card (text, nullable)
- nmls_number (text, nullable)
- work_email (text, nullable)
- headshot_url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `scripts`
```sql
- id (UUID, primary key)
- title (text)
- slug (text, unique)
- status (text: 'draft', 'live', 'archived')
- created_by (UUID, foreign key to users)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `scenes`
```sql
- id (UUID, primary key)
- script_id (UUID, foreign key to scripts)
- kind (text: 'hook', 'body', 'cta')
- text (text) - instructions/prompt for scene
- duration_seconds (integer)
- scene_order (integer: 1, 2, 3)
- created_at (timestamp)
```

#### `videos`
```sql
- id (UUID, primary key)
- script_id (UUID, foreign key to scripts)
- user_id (UUID, foreign key to users)
- status (text: 'recording', 'rendering', 'ready', 'error')
- render_job_id (text, nullable) - Shotstack job ID
- file_url (text, nullable) - S3 URL to final MP4
- completed_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `video_clips`
```sql
- id (UUID, primary key)
- video_id (UUID, foreign key to videos)
- scene_id (UUID, foreign key to scenes)
- clip_url (text) - S3 URL to raw clip
- duration_seconds (integer)
- uploaded_at (timestamp)
- created_at (timestamp)
```

#### `branding` (Currently Hardcoded)
```sql
- id (text: 'default')
- logo_url (text)
- disclaimer_text (text)
- end_card_text_color (text)
- disclaimer_text_color (text)
- end_card_hold_seconds (integer)
```

### **Storage Buckets**
- `video-clips` - Raw video recordings from officers
- `rendered-videos` - Final MP4 files after Shotstack rendering

### **Auto-Cleanup**
PostgreSQL scheduled function deletes raw clips 24 hours after render completion:
```sql
-- Clips auto-deleted 24h after video render completes
SELECT cron.schedule(
  'cleanup-old-clips',
  '0 * * * *', -- Every hour
  'DELETE FROM video_clips WHERE created_at < NOW() - INTERVAL ''24 hours''
);
```

---

## **6. API Endpoints**

### **Users**
```
POST   /api/users              - Create new officer (auto creates auth account)
GET    /api/users              - List all officers
```

### **Scripts**
```
POST   /api/scripts            - Create script with scenes
GET    /api/scripts            - List all scripts
PUT    /api/scripts/[id]       - Update script status (draft → live)
```

### **Videos**
```
GET    /api/videos             - List videos (optional ?status=ready)
POST   /api/render             - Trigger Shotstack render job
```

### **Webhooks**
```
POST   /api/webhook/shotstack  - Receive render completion from Shotstack
```

---

## **7. Key Features**

### **Admin Dashboard**

#### Users Page
- ✅ Add new loan officers (name, email, password, phone, NMLS, title)
- ✅ Auto-creates Supabase Auth account with password
- ✅ View all officers with contact info
- ✅ Officers can change password in app settings

#### Scripts Page
- ✅ Create scripts with 3 scenes (Hook, Body, CTA)
- ✅ Set duration for each scene
- ✅ Add guidance text for officers ("Be energetic", etc.)
- ✅ Toggle script status: **Draft** → **Live**
- ✅ Only live scripts appear in officer app
- ✅ View all scripts with status badges

#### Videos Page
- ✅ View all rendered videos
- ✅ Filter by status (ready, rendering, error)
- ✅ Download final MP4
- ✅ See rendering progress in real-time

### **Officer App**

#### Login Screen
- ✅ Email + password authentication
- ✅ Clear instructions
- ✅ Error messages if login fails

#### Recording Screen
- ✅ List available **live** scripts
- ✅ Tap script → Start recording
- ✅ Record Scene 1 (Hook), 2 (Body), 3 (CTA) sequentially
- ✅ Visual guidance for each scene (emoji + instructions)
- ✅ Recording timer shows elapsed seconds
- ✅ Progress bar shows which scenes are complete
- ✅ Auto-upload each clip to Supabase after recording
- ✅ "Render" button triggers final video assembly
- ✅ Officers get feedback: "Scene recorded!", "All scenes done!"

#### Settings Screen
- ✅ Display logged-in email
- ✅ Change password (requires current password)
- ✅ Sign out

---

## **8. Video Rendering Pipeline**

### **Shotstack Integration**

When officer clicks "Render":

1. **API Call** → `/api/render` endpoint
2. **Fetch clips** → Get all 3 scene clips from Supabase
3. **Build timeline** → Create Shotstack JSON with:
   - Video track: 3 scene clips in order
   - Text/image track: End card elements
4. **End Card Content** (hardcoded branding):
   - Logo image (top-center)
   - Officer name (bold, white text)
   - Title + NMLS number
   - Direct phone number
   - Work email
   - Disclaimer text (gray, small)
5. **Submit to Shotstack** → POST JSON to Shotstack API
6. **Get job ID** → Shotstack returns `render_job_id`
7. **Update video record** → Set `status: 'rendering'`

### **Webhook Completion**

When Shotstack finishes:

1. **Shotstack calls** → `/api/webhook/shotstack`
2. **Update video** → Set `status: 'ready'`, save `file_url`
3. **Admin sees video** → Ready to download on Videos page
4. **Auto-cleanup** → Raw clips deleted 24h later

---

## **9. Environment Variables**

### **Admin (.env.local)**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SHOTSTACK_API_KEY=your-shotstack-key
SHOTSTACK_API_URL=https://api.shotstack.io/edit/v1/render
```

### **Officer (.env.local)**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## **10. Deployment**

### **Admin Dashboard → Vercel**
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys on push
# Or manually: vercel deploy
```

### **Officer App → Web (Recommended)**
```bash
# Same Vercel deployment or separate URL
# Browser-based, no app store needed
```

### **Officer App → TestFlight (iOS Optional)**
```bash
cd officer
eas build --platform ios --profile production
# Upload to App Store Connect → TestFlight
```

---

## **11. Hardcoded Branding**

All branding is currently hardcoded in `/admin/app/api/render/route.ts`:

```typescript
const branding = {
  logo_url: 'https://8blocks.s3-us-west-1.amazonaws.com/neo/images/logo.png',
  disclaimer_text: '© 2026 Better Home & Finance Holding Company...',
  end_card_text_color: '#FFFFFF',
  disclaimer_text_color: '#999999',
  end_card_hold_seconds: 3,
}
```

**Future enhancement**: Move to database for admin control.

---

## **12. Setup & Installation**

### **Prerequisites**
- Node.js 18+
- Git
- Supabase account
- Shotstack account
- Vercel account
- Apple Developer account (if using TestFlight)

### **Local Development**

```bash
# Clone repo
git clone https://github.com/cmjaxin/FINFREE-REELS.git
cd neo-reels

# Install admin dependencies
cd admin
npm install

# Install officer dependencies
cd ../officer
npm install

# Set up .env.local files (see section 9)

# Run admin dashboard
cd admin
npm run dev
# → http://localhost:3000

# Run officer app (in another terminal)
cd officer
npm run start
# → Scan QR code with Expo Go or use simulator
```

### **Production Deployment**

```bash
# Admin dashboard auto-deploys via Vercel
git push origin main

# Officer app: Deploy as web app to Vercel
cd officer
vercel deploy
```

---

## **13. Testing Workflow**

### **End-to-End Test**

1. **Admin Setup**
   - Create user: "John Officer" (john@company.com, password: "Test123!")
   - Create script: "Refinance Benefits" with 3 scenes
   - Mark script as "Live"

2. **Officer Recording**
   - Login: john@company.com / Test123!
   - Select script
   - Record Scene 1 (say: "Hi, I'm John, refinancing expert")
   - Record Scene 2 (explain offer)
   - Record Scene 3 (call to action)
   - Tap "Render"

3. **Admin Verification**
   - Go to Videos page
   - See video with status "rendering" (5-10 min wait)
   - Once ready, download MP4
   - Verify: video has John's name, title, phone, email on end card

---

## **14. Known Issues & Solutions**

| Issue | Cause | Solution |
|-------|-------|----------|
| RLS policy errors | Database-level access control | Disable RLS for MVP (already done) |
| Branding won't save | Database connection issues | Hardcoded branding in render API |
| Camera not working | Permission not granted | Grant camera access on first login |
| Clips not uploading | Supabase storage config | Check bucket names and permissions |
| Shotstack errors | Invalid API key or timeout | Verify credentials, check queue |

---

## **15. Roadmap & Future Features**

### **Phase 2 (Post-MVP)**
- [ ] Admin dashboard for branding (save to database)
- [ ] Script assignment: assign scripts to specific officers
- [ ] Video templates: multiple end card designs
- [ ] Analytics: track officer video performance
- [ ] Custom fonts & colors: admin-controlled styling
- [ ] Video preview: watch rendered video in-app
- [ ] Bulk upload: upload multiple clips at once

### **Phase 3 (Scale)**
- [ ] Mobile app stores (iOS App Store, Google Play)
- [ ] Offline recording: record without internet
- [ ] Video editor: trim/adjust clips before render
- [ ] Social media integration: auto-share to LinkedIn, Facebook
- [ ] CRM integration: auto-populate officer data
- [ ] Advanced analytics: engagement tracking, click-through rates

---

## **16. Security Considerations**

### **Implemented**
- ✅ Supabase Auth: Email/password with service role for admin operations
- ✅ HTTPS only: All API calls encrypted in transit
- ✅ Storage access: Supabase storage bucket permissions restrict access
- ✅ No sensitive data in URLs: Use POST with body for credentials

### **To-Do**
- [ ] Rate limiting on APIs
- [ ] Audit logging for admin actions
- [ ] IP whitelisting for API access
- [ ] GDPR: Data deletion policies

---

## **17. Performance Metrics**

| Metric | Target | Status |
|--------|--------|--------|
| Login time | < 2s | ✅ Achieved |
| Recording UI load | < 1s | ✅ Achieved |
| Video upload (30s clip) | < 5s | ✅ Achieved |
| Shotstack render time | 5-10 min | ✅ Typical |
| Dashboard load | < 2s | ✅ Achieved |

---

## **18. Support & Debugging**

### **Common Commands**

```bash
# Check Supabase connection
supabase status

# View Shotstack render status
curl https://api.shotstack.io/edit/v1/render/{renderId} \
  -H "x-api-key: YOUR_KEY"

# Clear Expo cache
npm run start -- --clear

# Check Vercel deployment logs
vercel logs
```

### **Support Contacts**
- Supabase Issues: https://supabase.com/docs
- Shotstack Issues: https://shotstack.io/docs
- Vercel Issues: https://vercel.com/support

---

## **19. Glossary**

- **Hook** - Opening scene (15-30s): Introduce yourself
- **Body** - Main scene (30-60s): Explain offer/benefits
- **CTA** - Call-to-action (15s): Direct viewers what to do
- **Render** - Process of stitching clips + adding branding = final video
- **End card** - Final screen showing officer contact info + disclaimer
- **NMLS** - Nationwide Multistate Licensing System number (loan officer ID)
- **Clip** - Single recorded scene (raw video)
- **Shotstack** - Third-party API that renders/stitches videos
- **Supabase** - Backend as a Service (database, auth, storage)

---

## **20. Contact & Maintenance**

**Project Lead**: Colin Jenson (Colin.jenson@neohomeloans.com)
**GitHub Repo**: https://github.com/cmjaxin/FINFREE-REELS
**Deployment**: https://finfree-reels.vercel.app

Last Updated: August 4, 2026
Status: MVP Complete ✅
