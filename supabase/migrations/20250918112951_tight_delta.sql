/*
  # Fix RLS Policies for Audio Upload

  This migration properly configures Row Level Security policies to allow authenticated users
  to upload audio files and save metadata to the database.

  1. Database Policies
     - Allow authenticated users to insert their own audio files
     - Allow authenticated users to read their own audio files
     - Allow authenticated users to update their own audio files
     - Allow authenticated users to delete their own audio files

  2. Storage Policies
     - Allow authenticated users to upload files to their own folders
     - Allow authenticated users to read their own files
     - Allow authenticated users to delete their own files
*/

-- Ensure RLS is enabled on audio_files table
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own audio files" ON audio_files;
DROP POLICY IF EXISTS "Users can read own audio files" ON audio_files;
DROP POLICY IF EXISTS "Users can update own audio files" ON audio_files;
DROP POLICY IF EXISTS "Users can delete own audio files" ON audio_files;

-- Create proper RLS policies for audio_files table
CREATE POLICY "Users can insert own audio files"
  ON audio_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can read own audio files"
  ON audio_files
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own audio files"
  ON audio_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own audio files"
  ON audio_files
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Storage policies for audio-files bucket
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;

-- Create storage policies for the audio-files bucket
CREATE POLICY "Users can upload own audio files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own audio files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own audio files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );