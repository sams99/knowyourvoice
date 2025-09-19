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

// Direct Gemini API integration for frontend
export function useDirectAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { setCurrentAnalysis, setError } = useAppStore();
  const { user } = useAuth();

  const analyzeTranscription = async (
    transcriptionId: string, 
    systemPrompt: string,
    options: AnalysisOptions = {}
  ) => {
    if (!user) {
      setError('Please sign in to analyze transcriptions');
      return;
    }

    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      setError('Gemini API key not configured');
      return;
    }

    try {
      setIsAnalyzing(true);
      setProgress(10);
      setError(null);

      // Get transcription data from database
      const { data: transcription, error: transcriptionError } = await supabase
        .from('transcriptions')
        .select('transcription_text, audio_files!inner(user_id)')
        .eq('id', transcriptionId)
        .single();

      if (transcriptionError || !transcription) {
        throw new Error('Transcription not found');
      }

      // Verify user owns the transcription
      if (transcription.audio_files.user_id !== user.id) {
        throw new Error('Unauthorized access to transcription');
      }

      setProgress(30);

      const startTime = Date.now();

      // Prepare Gemini API request using Flash-2.0 model
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nTranscription to analyze:\n${transcription.transcription_text}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      setProgress(50);

      // Call Gemini API directly
      const geminiResponse = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorData}`);
      }

      const geminiResult = await geminiResponse.json();
      const processingTime = (Date.now() - startTime) / 1000;

      setProgress(80);

      // Extract AI response
      const aiResponse = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
      const tokenCount = geminiResult.usageMetadata?.totalTokenCount || 0;

      if (!aiResponse || aiResponse === 'No response generated') {
        throw new Error('No analysis response received from Gemini');
      }

      setProgress(90);

      // Save analysis to database
      const { data: analysisData, error: insertError } = await supabase
        .from('ai_analyses')
        .insert({
          transcription_id: transcriptionId,
          system_prompt: systemPrompt,
          ai_response: aiResponse,
          model_used: 'gemini-2.0-flash-exp',
          token_count: tokenCount,
          processing_time: processingTime,
          analysis_type: options.analysisType || 'general',
          metadata: {
            gemini_response: geminiResult,
            safety_ratings: geminiResult.candidates?.[0]?.safetyRatings || []
          }
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save analysis: ${insertError.message}`);
      }

      setProgress(100);
      setCurrentAnalysis(analysisData);

      return analysisData;

    } catch (error) {
      console.error('Direct analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
      throw error;
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
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
    analyzeTranscription,
    getAnalysisHistory,
    isAnalyzing,
    progress,
    ANALYSIS_PROMPTS,
  };
}
