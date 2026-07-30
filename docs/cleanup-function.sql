-- Create a function to delete old video clips
CREATE OR REPLACE FUNCTION cleanup_old_video_clips()
RETURNS void AS $$
DECLARE
  v_video_id UUID;
  v_clip_path TEXT;
BEGIN
  -- Find all videos that are ready and completed more than 24 hours ago
  -- and haven't had their clips deleted yet
  FOR v_video_id IN
    SELECT id FROM videos
    WHERE status = 'ready'
      AND completed_at IS NOT NULL
      AND completed_at < NOW() - INTERVAL '24 hours'
      AND clips_deleted_at IS NULL
  LOOP
    -- Delete all clips for this video from storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'video-clips' 
      AND name LIKE v_video_id::text || '/%';
    
    -- Delete the video clip records from database
    DELETE FROM video_clips WHERE video_id = v_video_id;
    
    -- Update the video record to mark clips as deleted
    UPDATE videos 
    SET clips_deleted_at = NOW()
    WHERE id = v_video_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup to run daily at 2 AM
-- First, enable pg_cron extension:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Then schedule the job:
SELECT cron.schedule('cleanup-old-clips', '0 2 * * *', 'SELECT cleanup_old_video_clips()');
