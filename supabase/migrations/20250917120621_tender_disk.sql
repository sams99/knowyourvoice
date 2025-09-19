/*
  # Audio Transcription and AI Analysis Database Schema

  1. New Tables
    - `audio_files` - Stores uploaded audio file metadata
    - `transcriptions` - Stores transcription results from Deepgram
    - `ai_analyses` - Stores AI analysis results from Gemini
    - `user_preferences` - Stores user settings and default prompts
    - `processing_jobs` - Tracks async processing status

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Storage policies for audio file access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Audio files table
CREATE TABLE IF NOT EXISTS audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  duration real,
  format text NOT NULL,
  mime_type text NOT NULL,
  upload_type text NOT NULL CHECK (upload_type IN ('upload', 'recording')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_file_id uuid NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
  transcription_text text NOT NULL,
  confidence_score real,
  processing_time real,
  word_count integer,
  deepgram_response jsonb,
  language text DEFAULT 'en',
  model text DEFAULT 'nova-2',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI analyses table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id uuid NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
  system_prompt text NOT NULL,
  ai_response text NOT NULL,
  model_used text NOT NULL DEFAULT 'gemini-pro',
  token_count integer,
  processing_time real,
  analysis_type text DEFAULT 'general',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_prompts jsonb DEFAULT '[]'::jsonb,
  preferred_model text DEFAULT 'gemini-pro',
  audio_quality text DEFAULT 'standard',
  auto_analyze boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Processing jobs table for tracking async operations
CREATE TABLE IF NOT EXISTS processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_file_id uuid REFERENCES audio_files(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (job_type IN ('transcription', 'analysis')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message text,
  result_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_files
CREATE POLICY "Users can read own audio files"
  ON audio_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audio files"
  ON audio_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audio files"
  ON audio_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audio files"
  ON audio_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for transcriptions
CREATE POLICY "Users can read own transcriptions"
  ON transcriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = (SELECT user_id FROM audio_files WHERE id = audio_file_id));

CREATE POLICY "Users can insert own transcriptions"
  ON transcriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (SELECT user_id FROM audio_files WHERE id = audio_file_id));

CREATE POLICY "Users can update own transcriptions"
  ON transcriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = (SELECT user_id FROM audio_files WHERE id = audio_file_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM audio_files WHERE id = audio_file_id));

-- RLS Policies for ai_analyses
CREATE POLICY "Users can read own ai analyses"
  ON ai_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = (
    SELECT af.user_id 
    FROM audio_files af 
    JOIN transcriptions t ON af.id = t.audio_file_id 
    WHERE t.id = transcription_id
  ));

CREATE POLICY "Users can insert own ai analyses"
  ON ai_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (
    SELECT af.user_id 
    FROM audio_files af 
    JOIN transcriptions t ON af.id = t.audio_file_id 
    WHERE t.id = transcription_id
  ));

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for processing_jobs
CREATE POLICY "Users can read own processing jobs"
  ON processing_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own processing jobs"
  ON processing_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own processing jobs"
  ON processing_jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_created_at ON audio_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcriptions_audio_file_id ON transcriptions(audio_file_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_transcription_id ON ai_analyses(transcription_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_audio_files_updated_at BEFORE UPDATE ON audio_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transcriptions_updated_at BEFORE UPDATE ON transcriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_analyses_updated_at BEFORE UPDATE ON ai_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_processing_jobs_updated_at BEFORE UPDATE ON processing_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();