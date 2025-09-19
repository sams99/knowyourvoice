import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export function useAudioRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { setCurrentAudioFile, setError } = useAppStore();
  const { user } = useAuth();

  const startRecording = useCallback(async () => {
    if (!user) {
      setError('Please sign in to record audio');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        setRecordingState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }));
      };

      mediaRecorder.start(1000); // Collect data every second

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
      }));

      setError(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, [user, setError]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      setRecordingState(prev => ({
        ...prev,
        isPaused: true,
      }));
    }
  }, [recordingState.isRecording]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      
      // Resume duration timer
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      setRecordingState(prev => ({
        ...prev,
        isPaused: false,
      }));
    }
  }, [recordingState.isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, []);

  const saveRecording = useCallback(async () => {
    if (!recordingState.audioBlob || !user) {
      setError('No recording to save or user not authenticated');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Convert to a more common format and create file name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording-${timestamp}.webm`;
      const filePath = `${user.id}/${filename}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, recordingState.audioBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Save file metadata to database
      const { data: audioFileData, error: dbError } = await supabase
        .from('audio_files')
        .insert({
          user_id: user.id,
          filename,
          file_path: filePath,
          file_size: recordingState.audioBlob.size,
          duration: recordingState.duration,
          format: 'webm',
          mime_type: 'audio/webm',
          upload_type: 'recording',
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('audio-files').remove([filePath]);
        throw new Error(`Failed to save recording metadata: ${dbError.message}`);
      }

      setCurrentAudioFile(audioFileData);

      // Clean up recording state
      if (recordingState.audioUrl) {
        URL.revokeObjectURL(recordingState.audioUrl);
      }

      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
      });

      return audioFileData;
    } catch (error) {
      console.error('Error saving recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to save recording');
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [recordingState.audioBlob, recordingState.audioUrl, recordingState.duration, user, setCurrentAudioFile, setError]);

  const discardRecording = useCallback(() => {
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }

    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    });
  }, [recordingState.audioUrl]);

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    recordingState,
    isSaving,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveRecording,
    discardRecording,
    formatDuration,
  };
}