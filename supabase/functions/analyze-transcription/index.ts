import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AnalysisRequest {
  transcriptionId: string;
  systemPrompt: string;
  model?: string;
  analysisType?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      transcriptionId, 
      systemPrompt, 
      model = 'gemini-pro',
      analysisType = 'general' 
    }: AnalysisRequest = await req.json();

    // Get transcription data
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

    // Create processing job
    const { data: jobData } = await supabase
      .from('processing_jobs')
      .insert({
        user_id: user.id,
        job_type: 'analysis',
        status: 'processing',
        progress: 10,
        metadata: { transcription_id: transcriptionId, model, analysis_type: analysisType }
      })
      .select()
      .single();

    const startTime = Date.now();

    // Prepare Gemini API request
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
    
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

    // Update progress
    await supabase
      .from('processing_jobs')
      .update({ progress: 50 })
      .eq('id', jobData?.id);

    // Call Gemini API
    const geminiResponse = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorData}`);
    }

    const geminiResult = await geminiResponse.json();
    const processingTime = (Date.now() - startTime) / 1000;

    // Update progress
    await supabase
      .from('processing_jobs')
      .update({ progress: 80 })
      .eq('id', jobData?.id);

    // Extract AI response
    const aiResponse = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    const tokenCount = geminiResult.usageMetadata?.totalTokenCount || 0;

    // Save analysis to database
    const { data: analysisData, error: insertError } = await supabase
      .from('ai_analyses')
      .insert({
        transcription_id: transcriptionId,
        system_prompt: systemPrompt,
        ai_response: aiResponse,
        model_used: model,
        token_count: tokenCount,
        processing_time: processingTime,
        analysis_type: analysisType,
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

    // Update processing job to completed
    if (jobData?.id) {
      await supabase
        .from('processing_jobs')
        .update({ 
          status: 'completed', 
          progress: 100,
          result_id: analysisData.id 
        })
        .eq('id', jobData.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisData,
        tokenCount,
        processingTime,
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Analysis error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});