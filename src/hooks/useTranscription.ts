import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';

export interface TranscriptionOptions {
  model?: string;
  language?: string;
  smartFormat?: boolean;
  diarize?: boolean;
}

export function useTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { setCurrentTranscription, setError, updateProcessingJob } = useAppStore();
  const { user } = useAuth();

  const startTranscription = async (audioFileId: string, options: TranscriptionOptions = {}) => {
    if (!user) {
      setError('Please sign in to transcribe audio');
      return;
    }

    try {
      setIsTranscribing(true);
      setError(null);

      // Get audio file info
      const { data: audioFile, error: audioError } = await supabase
        .from('audio_files')
        .select('*')
        .eq('id', audioFileId)
        .single();

      if (audioError || !audioFile) {
        throw new Error('Audio file not found');
      }

      // Create processing job
      const { data: jobData, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          user_id: user.id,
          audio_file_id: audioFileId,
          job_type: 'transcription',
          status: 'pending',
          progress: 0,
          metadata: { options },
        })
        .select()
        .single();

      if (jobError) {
        throw new Error('Failed to create processing job');
      }

      // Call transcription edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioFileId,
          filePath: audioFile.file_path,
          mimeType: audioFile.mime_type,
          options,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }

      setCurrentTranscription(result.transcription);
      return result.transcription;

    } catch (error) {
      console.error('Transcription error:', error);
      setError(error instanceof Error ? error.message : 'Transcription failed');
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  const pollProcessingStatus = async (jobId: string) => {
    try {
      const { data: job, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw error;
      }

      updateProcessingJob(jobId, job);
      return job;
    } catch (error) {
      console.error('Error polling job status:', error);
      return null;
    }
  };

  return {
    startTranscription,
    pollProcessingStatus,
    isTranscribing,
  };
}