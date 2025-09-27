import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';

export interface AnalysisOptions {
  model?: string;
  analysisType?: string;
}

// Fixed system prompt for sales call analysis
const FIXED_SYSTEM_PROMPT = `You are an experienced Sales Coach AI specialized in analyzing B2C and B2B sales conversations. 
Your role is to evaluate the salesperson's performance, identify strengths and weaknesses, 
and provide highly practical, constructive, and actionable feedback. 

## Persona:
- You are empathetic but direct like a senior sales mentor. 
- You never give generic advice like "be more confident". 
- You ground your evaluation in real sales psychology and the provided training material. 
- You ensure your analysis feels tailored to THIS call, not generic.

## Instructions:
1. Carefully read the sales call transcript provided below.  
2. Think step by step about the flow of the call (rapport, discovery, pitch, objection handling, closing).  
3. Cross-check if the salesperson included the **key knowledge points** from the company's training material:
   {{retrieved_chunks}}  
   If they missed any, highlight that in the feedback.  
4. Score the salesperson in the following categories on a scale of 1 to 10:
   - Rapport Building & Introduction
   - Understanding Client Needs
   - Product Knowledge & Value Communication
   - Objection Handling
   - Closing & Call-to-Action
5. Provide 2–3 short bullet points of feedback for each category. 
   Feedback should be concrete and improvement-oriented.  
   Example: Instead of "Improve objection handling", say "When client said 'too expensive', 
   you repeated features instead of showing long-term ROI."  

## Output Format:
Respond in **strict JSON only**, no extra text. Use this schema:

{
  "overall_score": <average of all category scores>,
  "criteria": {
    "rapport_building": {
      "score": <1-10>,
      "feedback": ["point1", "point2"]
    },
    "understanding_needs": {
      "score": <1-10>,
      "feedback": ["point1", "point2"]
    },
    "product_knowledge": {
      "score": <1-10>,
      "feedback": ["point1", "point2"]
    },
    "objection_handling": {
      "score": <1-10>,
      "feedback": ["point1", "point2"]
    },
    "closing": {
      "score": <1-10>,
      "feedback": ["point1", "point2"]
    }
  },
  "missed_training_points": [
    "list any relevant points from {{retrieved_chunks}} that were not covered"
  ],
  "strengths_summary": "1-2 sentence summary highlighting what the salesperson did well",
  "improvement_summary": "1-2 sentence summary highlighting what needs improvement"
}

## Transcript:
{{sales_call_transcript}}`;

// Direct Gemini API integration for frontend
export function useDirectAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { setCurrentAnalysis, setError } = useAppStore();
  const { user } = useAuth();

  const analyzeTranscription = async (
    transcriptionId: string, 
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
                text: FIXED_SYSTEM_PROMPT.replace('{{sales_call_transcript}}', transcription.transcription_text)
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
          system_prompt: FIXED_SYSTEM_PROMPT,
          ai_response: aiResponse,
          model_used: 'gemini-2.0-flash-exp',
          token_count: tokenCount,
          processing_time: processingTime,
          analysis_type: 'sales_coaching',
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
  };
}
