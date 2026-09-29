-- Run this in your Supabase SQL editor before connecting Video Editor.

CREATE TABLE IF NOT EXISTS render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  clip_urls TEXT[] NOT NULL,          -- ordered clip URLs for Video Editor
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')),
  output_url TEXT,                    -- Video Editor writes the finished file URL here
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_render_jobs_video_id ON render_jobs(video_id);
CREATE INDEX idx_render_jobs_status ON render_jobs(status);

-- Keep updated_at current automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER render_jobs_updated_at
  BEFORE UPDATE ON render_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable Realtime on this table so the site gets pushed updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE render_jobs;

-- RLS: service role (Video Editor) can read/update; authenticated users can insert/read their own
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth users can insert render jobs"
  ON render_jobs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth users can read own render jobs"
  ON render_jobs FOR SELECT TO authenticated USING (
    video_id IN (SELECT id FROM videos WHERE user_id = auth.uid())
  );

CREATE POLICY "service role full access"
  ON render_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
