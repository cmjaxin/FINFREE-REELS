# Splice: Developer Implementation Guide
## Complete Technical Handoff

---

## **Table of Contents**
1. [Quick Start](#quick-start)
2. [Architecture Deep Dive](#architecture-deep-dive)
3. [API Implementation](#api-implementation)
4. [Database Setup](#database-setup)
5. [Frontend Code Examples](#frontend-code-examples)
6. [Video Rendering Pipeline](#video-rendering-pipeline)
7. [Deployment Guide](#deployment-guide)
8. [Testing & QA](#testing--qa)
9. [Troubleshooting](#troubleshooting)

---

## **Quick Start**

### **Prerequisites**
```bash
# Required
Node.js 18+
npm or yarn
Git
GitHub account

# Accounts needed
Supabase (free tier: https://supabase.com)
Shotstack (free tier: https://shotstack.io)
Vercel (free tier: https://vercel.com)
```

### **Clone & Install (5 minutes)**
```bash
# Clone repo
git clone https://github.com/cmjaxin/FINFREE-REELS.git
cd neo-reels

# Install admin dependencies
cd admin
npm install
npm run dev
# → http://localhost:3000

# In another terminal, install officer app
cd officer
npm install
npm run start
# → Scan QR code with Expo Go or use simulator
```

### **Environment Setup (5 minutes)**

**Create `/admin/.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SHOTSTACK_API_KEY=your-shotstack-api-key
SHOTSTACK_API_URL=https://api.shotstack.io/edit/v1/render
```

**Create `/officer/.env.local`:**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get credentials from:**
1. Supabase: Settings → API → URL + Keys
2. Shotstack: Dashboard → API Keys
3. Keep `SUPABASE_SERVICE_ROLE_KEY` secret (admin only)

---

## **Architecture Deep Dive**

### **System Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD (Next.js)               │
│  - Create users (auto-creates auth accounts)                │
│  - Create scripts (3 scenes per script)                     │
│  - View/download rendered videos                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────────┐
        │   SUPABASE POSTGRESQL (Database) │
        │  - users                         │
        │  - scripts                       │
        │  - scenes                        │
        │  - videos                        │
        │  - video_clips                   │
        └──────────────────────────────────┘
                       │
      ┌────────────────┼────────────────┐
      ↓                ↓                ↓
┌──────────┐    ┌──────────────┐  ┌─────────────┐
│ Auth API │    │ Storage API  │  │ Realtime DB │
└──────────┘    └──────────────┘  └─────────────┘
      │                ↓                
      │         ┌─────────────────┐
      │         │  Supabase       │
      │         │  Storage        │
      │         │ (video-clips,   │
      │         │ rendered-vids)  │
      │         └─────────────────┘
      │
      ↓
┌────────────────────────────┐
│  Officer App (Web/Mobile)  │
│  - Login (email/password)  │
│  - Record 3 scenes         │
│  - Upload clips to storage │
│  - Trigger render          │
└──────────────┬─────────────┘
               │
               ↓
     ┌──────────────────────┐
     │  Shotstack API       │
     │  - Receive clips     │
     │  - Stitch together   │
     │  - Add end card      │
     │  - Export MP4        │
     └──────────────┬───────┘
                    │
                    ↓
     ┌──────────────────────┐
     │  Webhook callback    │
     │  /api/webhook/       │
     │  shotstack           │
     └──────────────┬───────┘
                    │
                    ↓
     ┌──────────────────────┐
     │  Update video record │
     │  status: 'ready'     │
     │  file_url: download  │
     └──────────────────────┘
```

### **Data Flow: Recording to Render**

```
1. Officer logs in
   └─ POST /api/login (Supabase Auth)
   └─ Returns session token

2. Officer selects script
   └─ GET /api/scripts (fetch live scripts)
   └─ Returns: [{id, title, scenes: []}]

3. Officer records Scene 1
   └─ Camera → capture video
   └─ Upload to Supabase Storage (video-clips bucket)
   └─ Create video_clips record
   └─ POST /api/videos (create video record if first scene)

4. Officer records Scene 2 & 3 (repeat step 3)

5. Officer clicks "Render"
   └─ POST /api/render {videoId}
   └─ Fetch all 3 clips from storage
   └─ Build Shotstack JSON timeline
   └─ POST to Shotstack API
   └─ Get render_job_id
   └─ Update video record: {status: 'rendering', render_job_id}

6. Shotstack processes (5-10 min)
   └─ Stitches 3 clips
   └─ Adds end card (logo + officer info)
   └─ Exports MP4
   └─ Calls webhook

7. Webhook callback
   └─ POST /api/webhook/shotstack {render_id}
   └─ Update video: {status: 'ready', file_url, completed_at}

8. Admin views Videos page
   └─ GET /api/videos?status=ready
   └─ Downloads final MP4
```

---

## **API Implementation**

### **1. User Management**

**POST /admin/app/api/users/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      fullName,
      password,
      direct_phone,
      title_on_end_card,
      nmls_number,
    } = body

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password required' },
        { status: 400 }
      )
    }

    // Create Supabase Auth account (admin-level operation)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const authClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: authData, error: authError } = await authClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError) throw new Error(`Auth creation failed: ${authError.message}`)

    // Create user record in database
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          full_name: fullName,
          role: 'loan_officer',
          status: 'active',
          auth_id: authData?.user?.id,
          direct_phone,
          title_on_end_card,
          nmls_number,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### **2. Script Management**

**POST /admin/app/api/scripts/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, scenes } = body

    if (!title || !slug || !scenes || scenes.length !== 3) {
      return NextResponse.json(
        { error: 'Title, slug, and 3 scenes required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Insert script
    const { data: scriptData, error: scriptError } = await supabase
      .from('scripts')
      .insert([{ title, slug, status: 'draft' }])
      .select()

    if (scriptError) throw scriptError

    const scriptId = scriptData[0].id

    // Insert scenes
    const scenesWithScriptId = scenes.map((scene, idx) => ({
      ...scene,
      script_id: scriptId,
      scene_order: idx + 1,
    }))

    const { error: scenesError } = await supabase
      .from('scenes')
      .insert(scenesWithScriptId)

    if (scenesError) throw scenesError

    // Return complete script with scenes
    const { data: fullScript } = await supabase
      .from('scripts')
      .select('*, scenes(*)')
      .eq('id', scriptId)
      .single()

    return NextResponse.json(fullScript, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('scripts')
      .select('*, scenes(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**PUT /admin/app/api/scripts/[id]/route.ts**

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status || !['draft', 'live', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('scripts')
      .update({ status })
      .eq('id', params.id)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### **3. Video Rendering (Critical)**

**POST /admin/app/api/render/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return NextResponse.json({ error: 'videoId required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const shotStackApiKey = process.env.SHOTSTACK_API_KEY
    const shotStackUrl = process.env.SHOTSTACK_API_URL

    const supabase = createClient(supabaseUrl, anonKey)

    // 1. Fetch video with all clips
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*, video_clips(*, scenes(*))')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      throw new Error('Video not found')
    }

    // 2. Fetch officer info
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', video.user_id)
      .single()

    // 3. Hardcoded branding
    const branding = {
      logo_url: 'https://8blocks.s3-us-west-1.amazonaws.com/neo/images/logo.png',
      disclaimer_text: '© 2026 Better Home & Finance Holding Company and/or its affiliates. Better is a family of companies...',
      end_card_text_color: '#FFFFFF',
      disclaimer_text_color: '#999999',
      end_card_hold_seconds: 3,
    }

    // 4. Build Shotstack timeline
    const clips = (video.video_clips || []).sort(
      (a: any, b: any) => a.scenes.scene_order - b.scenes.scene_order
    )

    const videoTrackClips = clips.map((clip: any) => ({
      type: 'video',
      asset: {
        type: 'video',
        src: clip.clip_url,
      },
      length: clip.duration_seconds || 5,
    }))

    // 5. Build end card (text + image)
    const endCardClips: any[] = []

    // Logo image
    endCardClips.push({
      type: 'image',
      asset: {
        type: 'image',
        src: branding.logo_url,
      },
      position: 'top-center',
      scale: 0.3,
      offsetY: 20,
      length: branding.end_card_hold_seconds,
    })

    // Officer name
    endCardClips.push({
      type: 'title',
      text: user?.full_name || 'Officer',
      style: 'bold',
      color: branding.end_card_text_color,
      size: 'large',
      position: 'top-left',
      length: branding.end_card_hold_seconds,
    })

    // Title + NMLS
    if (user?.title_on_end_card || user?.nmls_number) {
      endCardClips.push({
        type: 'title',
        text: `${user?.title_on_end_card || ''} ${user?.nmls_number ? `• NMLS #${user.nmls_number}` : ''}`.trim(),
        style: 'normal',
        color: branding.end_card_text_color,
        size: 'small',
        position: 'top-left',
        offsetY: 40,
        length: branding.end_card_hold_seconds,
      })
    }

    // Phone
    if (user?.direct_phone) {
      endCardClips.push({
        type: 'title',
        text: user.direct_phone,
        style: 'normal',
        color: branding.disclaimer_text_color,
        size: 'small',
        position: 'bottom-left',
        length: branding.end_card_hold_seconds,
      })
    }

    // Email
    if (user?.work_email) {
      endCardClips.push({
        type: 'title',
        text: user.work_email,
        style: 'normal',
        color: branding.disclaimer_text_color,
        size: 'small',
        position: 'bottom-left',
        offsetY: -20,
        length: branding.end_card_hold_seconds,
      })
    }

    // Disclaimer
    endCardClips.push({
      type: 'title',
      text: branding.disclaimer_text,
      style: 'normal',
      color: branding.disclaimer_text_color,
      size: 'xsmall',
      position: 'bottom-center',
      length: branding.end_card_hold_seconds,
    })

    // 6. Build full timeline
    const timeline = {
      background: { color: '#000000' },
      tracks: [
        { clips: videoTrackClips },
        { clips: endCardClips },
      ],
    }

    // 7. Send to Shotstack
    const shotStackResponse = await fetch(shotStackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': shotStackApiKey,
      },
      body: JSON.stringify({
        timeline,
        output: {
          format: 'mp4',
          resolution: '1920x1080',
        },
      }),
    })

    if (!shotStackResponse.ok) {
      throw new Error('Shotstack API error: ' + (await shotStackResponse.text()))
    }

    const shotStackData = await shotStackResponse.json()
    const renderId = shotStackData.response.id

    // 8. Update video record
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        render_job_id: renderId,
        status: 'rendering',
        updated_at: new Date().toISOString(),
      })
      .eq('id', videoId)

    if (updateError) throw updateError

    return NextResponse.json({ renderId, videoId })
  } catch (error: any) {
    console.error('Render error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### **4. Shotstack Webhook**

**POST /admin/app/api/webhook/shotstack/route.ts**

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, data } = body

    if (status !== 'done') {
      return NextResponse.json({ received: true })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Find video by render_job_id
    const { data: videos } = await supabase
      .from('videos')
      .select('*')
      .eq('render_job_id', id)

    if (!videos || videos.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const video = videos[0]

    // Update video record
    const { error } = await supabase
      .from('videos')
      .update({
        status: 'ready',
        file_url: data.url, // Shotstack provides the download URL
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', video.id)

    if (error) throw error

    console.log(`Video ${video.id} ready: ${data.url}`)
    return NextResponse.json({ updated: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

---

## **Database Setup**

### **Complete Schema (Supabase SQL)**

Run this in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  auth_id UUID NOT NULL,
  role TEXT DEFAULT 'loan_officer',
  status TEXT DEFAULT 'active',
  direct_phone TEXT,
  title_on_end_card TEXT,
  nmls_number TEXT,
  work_email TEXT,
  headshot_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Scripts table
CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Scenes table
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  text TEXT,
  duration_seconds INTEGER,
  scene_order INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES scripts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'recording',
  render_job_id TEXT,
  file_url TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Video clips table
CREATE TABLE video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  scene_id UUID NOT NULL REFERENCES scenes(id),
  clip_url TEXT NOT NULL,
  duration_seconds INTEGER,
  uploaded_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_scripts_status ON scripts(status);
CREATE INDEX idx_video_clips_video_id ON video_clips(video_id);

-- Set up storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('video-clips', 'video-clips', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('rendered-videos', 'rendered-videos', false);

-- Auto-cleanup: Delete raw clips 24h after render
CREATE OR REPLACE FUNCTION cleanup_old_clips()
RETURNS void AS $$
BEGIN
  DELETE FROM video_clips
  WHERE created_at < NOW() - INTERVAL '24 hours'
  AND video_id IN (
    SELECT id FROM videos WHERE status = 'ready'
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
SELECT cron.schedule(
  'cleanup-old-clips',
  '0 * * * *',
  'SELECT cleanup_old_clips()'
);
```

### **Storage Bucket Policies**

In Supabase → Storage → Policies:

**video-clips bucket:**
```sql
-- Allow authenticated users to upload their own clips
CREATE POLICY "Users can upload clips"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'video-clips' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own clips
CREATE POLICY "Users can read their clips"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'video-clips' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## **Frontend Code Examples**

### **Admin: Create User**

**admin/app/dashboard/users/page.tsx (simplified)**

```typescript
'use client'
import { useState } from 'react'

export default function UsersPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    directPhone: '',
    titleOnEndCard: '',
    nmslNumber: '',
  })

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        direct_phone: formData.directPhone,
        title_on_end_card: formData.titleOnEndCard,
        nmls_number: formData.nmslNumber,
      }),
    })

    if (res.ok) {
      alert('Officer created!')
      setFormData({ fullName: '', email: '', password: '', directPhone: '', titleOnEndCard: '', nmslNumber: '' })
    } else {
      alert('Error creating officer')
    }
  }

  return (
    <form onSubmit={handleCreateUser}>
      <input
        type="text"
        placeholder="Full name"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />
      <input
        type="tel"
        placeholder="Phone"
        value={formData.directPhone}
        onChange={(e) => setFormData({ ...formData, directPhone: e.target.value })}
      />
      <input
        type="text"
        placeholder="NMLS Number"
        value={formData.nmslNumber}
        onChange={(e) => setFormData({ ...formData, nmslNumber: e.target.value })}
      />
      <input
        type="text"
        placeholder="Title"
        value={formData.titleOnEndCard}
        onChange={(e) => setFormData({ ...formData, titleOnEndCard: e.target.value })}
      />
      <button type="submit">Create Officer</button>
    </form>
  )
}
```

### **Officer: Recording Flow**

**officer/screens/RecordingScreen.tsx (key section)**

```typescript
import { useState, useRef } from 'react'
import { CameraView } from 'expo-camera'
import * as FileSystem from 'expo-file-system'
import { supabase } from '../lib/supabase'

export default function RecordingScreen() {
  const [recording, setRecording] = useState(false)
  const [recordedScenes, setRecordedScenes] = useState<Set<number>>(new Set())
  const cameraRef = useRef<CameraView>(null)
  const [selectedScript, setSelectedScript] = useState(null)
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0)

  const startRecording = async () => {
    if (!cameraRef.current) return
    try {
      setRecording(true)
      const video = await cameraRef.current.recordAsync()
      setRecording(false)

      if (video?.uri) {
        await uploadSceneClip(video.uri)
      }
    } catch (error) {
      console.error('Recording error:', error)
      setRecording(false)
    }
  }

  const uploadSceneClip = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const fileName = `${selectedScript.id}/${selectedScript.scenes[currentSceneIdx].id}.mp4`

      const { error } = await supabase.storage
        .from('video-clips')
        .upload(fileName, Buffer.from(base64, 'base64'), {
          contentType: 'video/mp4',
        })

      if (error) throw error

      // Mark as recorded
      const newRecorded = new Set(recordedScenes)
      newRecorded.add(currentSceneIdx)
      setRecordedScenes(newRecorded)

      // Move to next scene
      if (currentSceneIdx < selectedScript.scenes.length - 1) {
        setCurrentSceneIdx(currentSceneIdx + 1)
      }

      alert('Scene recorded!')
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    }
  }

  const handleRender = async () => {
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedScript.id }),
      })

      if (!res.ok) throw new Error('Render failed')

      alert('Rendering started! Check Videos page to monitor progress')
      setSelectedScript(null)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div>
      <CameraView style={{ flex: 1 }} ref={cameraRef} facing="front" />
      <button onClick={recording ? () => cameraRef.current?.stopRecording() : startRecording}>
        {recording ? 'Stop' : 'Record'}
      </button>
      {recordedScenes.size === selectedScript?.scenes.length && (
        <button onClick={handleRender}>Render Video</button>
      )}
    </div>
  )
}
```

---

## **Video Rendering Pipeline**

### **Shotstack Timeline Structure**

The JSON sent to Shotstack looks like this:

```json
{
  "timeline": {
    "background": {
      "color": "#000000"
    },
    "tracks": [
      {
        "clips": [
          {
            "type": "video",
            "asset": {
              "type": "video",
              "src": "https://supabase.../video-clips/scene1.mp4"
            },
            "length": 30
          },
          {
            "type": "video",
            "asset": {
              "type": "video",
              "src": "https://supabase.../video-clips/scene2.mp4"
            },
            "length": 60
          },
          {
            "type": "video",
            "asset": {
              "type": "video",
              "src": "https://supabase.../video-clips/scene3.mp4"
            },
            "length": 15
          }
        ]
      },
      {
        "clips": [
          {
            "type": "image",
            "asset": {
              "type": "image",
              "src": "https://8blocks.s3.../logo.png"
            },
            "position": "top-center",
            "scale": 0.3,
            "length": 3
          },
          {
            "type": "title",
            "text": "John Davis",
            "style": "bold",
            "color": "#FFFFFF",
            "size": "large",
            "position": "top-left",
            "length": 3
          },
          {
            "type": "title",
            "text": "Senior Loan Officer • NMLS #123456",
            "style": "normal",
            "color": "#FFFFFF",
            "size": "small",
            "position": "top-left",
            "offsetY": 40,
            "length": 3
          },
          {
            "type": "title",
            "text": "+1 (555) 123-4567",
            "style": "normal",
            "color": "#999999",
            "size": "small",
            "position": "bottom-left",
            "length": 3
          },
          {
            "type": "title",
            "text": "john@company.com",
            "style": "normal",
            "color": "#999999",
            "size": "small",
            "position": "bottom-left",
            "offsetY": -20,
            "length": 3
          },
          {
            "type": "title",
            "text": "© 2026 Better Home & Finance...",
            "style": "normal",
            "color": "#999999",
            "size": "xsmall",
            "position": "bottom-center",
            "length": 3
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "resolution": "1920x1080"
  }
}
```

### **Polling Render Status (Alternative to Webhook)**

If webhook fails, poll Shotstack:

```typescript
const checkRenderStatus = async (renderId: string) => {
  const response = await fetch(
    `https://api.shotstack.io/edit/v1/render/${renderId}`,
    {
      headers: { 'x-api-key': SHOTSTACK_API_KEY },
    }
  )
  const data = await response.json()
  
  if (data.response.status === 'done') {
    console.log('Video ready:', data.response.data.url)
    // Update database with file_url
  } else if (data.response.status === 'failed') {
    console.error('Render failed:', data.response.data.error)
  } else {
    console.log('Still rendering...')
    setTimeout(() => checkRenderStatus(renderId), 10000) // Check every 10s
  }
}
```

---

## **Deployment Guide**

### **Deploy Admin Dashboard to Vercel**

```bash
# 1. Push to GitHub
cd neo-reels
git add .
git commit -m "Production ready"
git push origin main

# 2. Connect to Vercel (one-time)
npm install -g vercel
vercel login
cd admin
vercel

# 3. Set environment variables in Vercel dashboard
# Settings → Environment Variables → Add:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# SHOTSTACK_API_KEY
# SHOTSTACK_API_URL

# 4. Auto-deploys on git push to main
```

### **Deploy Officer App as Web (Recommended)**

Officer app can run as a web app on Vercel too:

```bash
cd officer

# Create next.config.js for Next.js setup
echo 'module.exports = { reactStrictMode: true }' > next.config.js

# Deploy
vercel
```

### **Deploy Officer App to TestFlight (iOS)**

```bash
# 1. Build with EAS
cd officer
eas build --platform ios --profile production

# 2. Download .ipa from EAS result
# 3. Upload to App Store Connect
# 4. Add testers via TestFlight
# 5. Share invite link with officers
```

---

## **Testing & QA**

### **Manual Testing Checklist**

**Admin Dashboard:**
- [ ] Create user → Check Supabase users table
- [ ] Create script with 3 scenes → Verify in database
- [ ] Toggle script status draft ↔ live
- [ ] View videos → Filter by status
- [ ] Download rendered video → Check MP4 plays

**Officer App:**
- [ ] Login with created user
- [ ] See only "live" scripts
- [ ] Record Scene 1 → Upload to storage
- [ ] Record Scene 2 → Upload to storage
- [ ] Record Scene 3 → Upload to storage
- [ ] Click Render → Check /api/render called
- [ ] Wait 5-10 min for Shotstack
- [ ] Admin sees "ready" status
- [ ] Download video → Verify:
  - [ ] 3 clips stitched together
  - [ ] Logo on end card
  - [ ] Officer name visible
  - [ ] Title + NMLS visible
  - [ ] Phone + email visible
  - [ ] Disclaimer visible

### **API Testing with cURL**

```bash
# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test Officer",
    "password": "Test123!",
    "direct_phone": "+1 (555) 123-4567",
    "title_on_end_card": "Senior Loan Officer",
    "nmls_number": "123456"
  }'

# Create script
curl -X POST http://localhost:3000/api/scripts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Script",
    "slug": "test-script",
    "scenes": [
      {"kind": "hook", "text": "Introduce yourself", "duration_seconds": 30},
      {"kind": "body", "text": "Explain offer", "duration_seconds": 60},
      {"kind": "cta", "text": "Call to action", "duration_seconds": 15}
    ]
  }'

# Get all videos
curl http://localhost:3000/api/videos

# Get ready videos only
curl http://localhost:3000/api/videos?status=ready
```

---

## **Troubleshooting**

### **"Cannot resolve entry file"**
```
Solution: Create /officer/index.js
Content:
import { registerRootComponent } from 'expo'
import App from './App'
registerRootComponent(App)
```

### **Supabase Auth Error: "Infinite Recursion"**
```
Solution: Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### **Shotstack Render Fails with "Invalid URL"**
```
Check:
1. Video clips actually uploaded to Supabase
2. Clip URLs are public/accessible
3. Add CORS headers if needed
4. Verify Shotstack API key
```

### **Officer Can't Login**
```
Check:
1. User created in Supabase Auth
2. User record exists in database
3. Email/password correct
4. Supabase connection working
```

### **Videos Not Rendering**
```
Check:
1. All 3 clips uploaded (check storage bucket)
2. /api/render endpoint called (check server logs)
3. Shotstack API key valid
4. Webhook endpoint reachable (test with webhook.site)
```

---

## **Key Files Reference**

| File | Purpose | Key Function |
|------|---------|--------------|
| `/admin/app/api/users/route.ts` | Create/list users | `createUser()` - auto creates auth account |
| `/admin/app/api/scripts/route.ts` | CRUD scripts | Creates script + 3 scenes |
| `/admin/app/api/scripts/[id]/route.ts` | Update script | Toggle status: draft ↔ live |
| `/admin/app/api/render/route.ts` | Video rendering | Builds Shotstack JSON, submits render job |
| `/admin/app/api/webhook/shotstack/route.ts` | Render completion | Updates video when Shotstack finishes |
| `/admin/app/dashboard/users/page.tsx` | User management UI | Form to add new officers |
| `/admin/app/dashboard/scripts/page.tsx` | Script management UI | Create/toggle scripts |
| `/admin/app/dashboard/videos/page.tsx` | Video gallery | View + download rendered videos |
| `/officer/screens/RecordingScreen.tsx` | Recording UI | Record 3 scenes, upload clips, trigger render |
| `/officer/context/AuthContext.tsx` | Auth state | Login/logout, session management |

---

## **Environment Variables Checklist**

```
ADMIN (.env.local):
✓ NEXT_PUBLIC_SUPABASE_URL
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY  
✓ SUPABASE_SERVICE_ROLE_KEY (secret!)
✓ SHOTSTACK_API_KEY
✓ SHOTSTACK_API_URL

OFFICER (.env.local):
✓ EXPO_PUBLIC_SUPABASE_URL
✓ EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## **Support Resources**

- **Supabase Docs**: https://supabase.com/docs
- **Shotstack API**: https://shotstack.io/docs/api-reference/
- **Next.js**: https://nextjs.org/docs
- **Expo**: https://docs.expo.dev
- **GitHub Repo**: https://github.com/cmjaxin/FINFREE-REELS

---

**Last Updated:** August 4, 2026  
**Status:** Production Ready ✅
