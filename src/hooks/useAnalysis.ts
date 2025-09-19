import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';

export interface AnalysisOptions {
  model?: string;
  analysisType?: string;
}

export const ANALYSIS_PROMPTS = {
  summary: 'Please provide a concise summary of the main points discussed in this transcription.',
  sentiment: 'Analyze the sentiment and emotional tone of this transcription. Identify key emotions and overall sentiment.',
  keywords: 'Extract the most important keywords and key phrases from this transcription. Organize them by relevance.',
  actionItems: 'Identify any action items, tasks, or decisions mentioned in this transcription.',
  insights: 'Provide key insights and analysis points from this transcription. What are the most important takeaways?',
  custom: '', // Will be filled by user input
};

export function useAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { setCurrentAnalysis, setError } = useAppStore();
  const { user } = useAuth();

  const startAnalysis = async (
    transcriptionId: string, 
    systemPrompt: string,
    options: AnalysisOptions = {}
  ) => {
    if (!user) {
      setError('Please sign in to analyze transcriptions');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError(null);

      // Get session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Call analysis edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-transcription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptionId,
          systemPrompt,
          model: options.model || 'gemini-pro',
          analysisType: options.analysisType || 'general',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setCurrentAnalysis(result.analysis);
      return result.analysis;

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAnalysisHistory = async (transcriptionId: string) => {
    try {
      const { data: analyses, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('transcription_id', transcriptionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return analyses;
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  };

  return {
    startAnalysis,
    getAnalysisHistory,
    isAnalyzing,
    ANALYSIS_PROMPTS,
  };
}