-- NEO Reels Supabase Schema
-- Run these migrations in your Supabase SQL editor

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  nmls_number TEXT UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branding settings per company
CREATE TABLE IF NOT EXISTS branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#0C2033',
  accent_color TEXT DEFAULT '#4BC8F2',
  end_card_text_color TEXT DEFAULT '#F2F7FA',
  disclaimer_text_color TEXT DEFAULT '#61798A',
  end_card_template TEXT DEFAULT 'split', -- split | centered | lower
  end_card_hold_seconds FLOAT DEFAULT 3.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- End card field toggles
CREATE TABLE IF NOT EXISTS end_card_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branding_id UUID NOT NULL REFERENCES branding(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- officer_name | title_nmls | direct_phone | email | headshot
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branding_id, field_name)
);

-- Users (admin + loan officers)
CREATE TYPE user_role AS ENUM ('admin', 'loan_officer');
CREATE TYPE user_status AS ENUM ('active', 'idle', 'invited');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  title_on_end_card TEXT,
  work_email TEXT,
  direct_phone TEXT,
  nmls_number TEXT,
  headshot_url TEXT,
  role user_role DEFAULT 'loan_officer',
  status user_status DEFAULT 'active',
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);

-- Scripts (scene-based, assignable to officers)
CREATE TYPE script_status AS ENUM ('draft', 'live', 'archived');

CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if admin-authored
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  status script_status DEFAULT 'draft',
  total_duration_seconds INT,
  word_count INT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

CREATE INDEX idx_scripts_company_id ON scripts(company_id);
CREATE INDEX idx_scripts_author_id ON scripts(author_id);

-- Scenes (belong to scripts)
CREATE TYPE scene_kind AS ENUM ('hook', 'body', 'cta');

CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  kind scene_kind NOT NULL,
  text TEXT NOT NULL,
  duration_seconds INT,
  word_count INT,
  scene_order INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scenes_script_id ON scenes(script_id);

-- Script assignments to officers
CREATE TABLE IF NOT EXISTS script_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id, user_id)
);

CREATE INDEX idx_script_assignments_script_id ON script_assignments(script_id);
CREATE INDEX idx_script_assignments_user_id ON script_assignments(user_id);

-- Videos (rendered output per user + script)
CREATE TYPE video_status AS ENUM ('awaiting_scenes', 'uploading', 'rendering', 'ready', 'needs_review', 'error');

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status video_status DEFAULT 'awaiting_scenes',
  total_duration_seconds INT,
  trimmed_duration_seconds INT,
  file_url TEXT,
  thumbnail_url TEXT,
  render_job_id TEXT, -- Shotstack job ID
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_videos_company_id ON videos(company_id);
CREATE INDEX idx_videos_script_id ON videos(script_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);

-- Video clips (one per scene, raw upload)
CREATE TABLE IF NOT EXISTS video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  clip_url TEXT NOT NULL,
  duration_seconds INT,
  dead_air_trimmed_seconds INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_video_clips_video_id ON video_clips(video_id);
CREATE INDEX idx_video_clips_scene_id ON video_clips(scene_id);

-- Render jobs (pipeline status)
CREATE TYPE render_stage AS ENUM ('uploading', 'trimming', 'stitching', 'normalizing', 'end_card', 'complete');

CREATE TABLE IF NOT EXISTS render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  shotstack_job_id TEXT UNIQUE,
  current_stage render_stage DEFAULT 'uploading',
  progress_percent INT DEFAULT 0,
  stage_logs JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

CREATE INDEX idx_render_jobs_video_id ON render_jobs(video_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic for MVP)
-- Users can see their own company's data
CREATE POLICY "users_see_own_company" ON users
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id::text FROM users WHERE company_id = users.company_id
    )
  );

-- Allow users to update own profile
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE USING (auth.uid() = auth_id);

-- Scripts visible to company members
CREATE POLICY "scripts_visible_to_company" ON scripts
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE auth.uid() = users.auth_id
    )
  );

-- Videos visible to company members and their owners
CREATE POLICY "videos_visible_to_company" ON videos
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE auth.uid() = users.auth_id
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('headshots', 'headshots', false),
  ('video-clips', 'video-clips', false),
  ('rendered-videos', 'rendered-videos', false);

-- Storage policies
CREATE POLICY "headshots_auth_users_can_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'headshots' AND auth.role() = 'authenticated'
  );

CREATE POLICY "headshots_auth_users_can_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'headshots' AND auth.role() = 'authenticated'
  );

CREATE POLICY "video_clips_auth_users_can_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'video-clips' AND auth.role() = 'authenticated'
  );

CREATE POLICY "video_clips_auth_users_can_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'video-clips' AND auth.role() = 'authenticated'
  );

CREATE POLICY "rendered_videos_auth_users_can_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'rendered-videos' AND auth.role() = 'authenticated'
  );
