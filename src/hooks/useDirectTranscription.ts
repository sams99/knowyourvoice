import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';

// Direct Deepgram API integration for frontend
export function useDirectTranscription() {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { setCurrentTranscription, setError } = useAppStore();
  const { user } = useAuth();

  const transcribeAudio = async (audioFileId: string) => {
    if (!user) {
      setError('Please sign in to transcribe audio');
      return;
    }

    const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (!deepgramApiKey) {
      setError('Deepgram API key not configured');
      return;
    }

    try {
      setIsTranscribing(true);
      setProgress(10);
      setError(null);

      // Get audio file info from database
      const { data: audioFile, error: audioError } = await supabase
        .from('audio_files')
        .select('*')
        .eq('id', audioFileId)
        .single();

      if (audioError || !audioFile) {
        throw new Error('Audio file not found');
      }

      setProgress(25);

      // Download audio file from Supabase Storage
      const { data: audioBlob, error: downloadError } = await supabase.storage
        .from('audio-files')
        .download(audioFile.file_path);

      if (downloadError || !audioBlob) {
        throw new Error(`Failed to download audio file: ${downloadError?.message}`);
      }

      setProgress(40);

      // Prepare audio for Deepgram
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      setProgress(60);

      // Call Deepgram API directly
      const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramApiKey}`,
          'Content-Type': audioFile.mime_type,
        },
        body: arrayBuffer,
      });

      if (!deepgramResponse.ok) {
        const errorText = await deepgramResponse.text();
        throw new Error(`Deepgram API error: ${deepgramResponse.status} - ${errorText}`);
      }

      const transcriptionResult = await deepgramResponse.json();
      setProgress(80);

      // Extract transcription data
      const transcript = transcriptionResult.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = transcriptionResult.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;
      const words = transcriptionResult.results?.channels?.[0]?.alternatives?.[0]?.words || [];
      const wordCount = words.length;

      if (!transcript) {
        throw new Error('No transcription text received from Deepgram');
      }

      setProgress(90);

      // Save transcription to database
      const { data: transcriptionData, error: insertError } = await supabase
        .from('transcriptions')
        .insert({
          audio_file_id: audioFileId,
          transcription_text: transcript,
          confidence_score: confidence,
          word_count: wordCount,
          deepgram_response: transcriptionResult,
          language: 'en',
          model: 'nova-2',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save transcription: ${insertError.message}`);
      }

      setProgress(100);
      setCurrentTranscription(transcriptionData);

      return transcriptionData;

    } catch (error) {
      console.error('Direct transcription error:', error);
      setError(error instanceof Error ? error.message : 'Transcription failed');
      throw error;
    } finally {
      setIsTranscribing(false);
      setProgress(0);
    }
  };

  return {
    transcribeAudio,
    isTranscribing,
    progress,
  };
}
