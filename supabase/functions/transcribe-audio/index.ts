import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TranscriptionRequest {
  audioFileId: string;
  filePath: string;
  mimeType: string;
  options?: {
    model?: string;
    language?: string;
    smartFormat?: boolean;
    diarize?: boolean;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');

    if (!deepgramApiKey) {
      throw new Error('Deepgram API key not configured');
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

    const { audioFileId, filePath, mimeType, options = {} }: TranscriptionRequest = await req.json();

    // Update processing job status
    await supabase
      .from('processing_jobs')
      .update({ status: 'processing', progress: 10 })
      .eq('audio_file_id', audioFileId)
      .eq('job_type', 'transcription');

    // Download audio file from Supabase Storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('audio-files')
      .download(filePath);

    if (downloadError || !audioData) {
      throw new Error(`Failed to download audio file: ${downloadError?.message}`);
    }

    // Update progress
    await supabase
      .from('processing_jobs')
      .update({ progress: 30 })
      .eq('audio_file_id', audioFileId)
      .eq('job_type', 'transcription');

    // Convert blob to buffer
    const audioBuffer = await audioData.arrayBuffer();

    // Prepare Deepgram request
    const deepgramOptions = {
      model: options.model || 'nova-2',
      language: options.language || 'en',
      smart_format: options.smartFormat !== false,
      diarize: options.diarize || false,
      punctuate: true,
      paragraphs: true,
      utterances: true,
    };

    // Update progress
    await supabase
      .from('processing_jobs')
      .update({ progress: 50 })
      .eq('audio_file_id', audioFileId)
      .eq('job_type', 'transcription');

    // Call Deepgram API
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': mimeType,
      },
      body: new URLSearchParams(deepgramOptions).toString() + '&' + new Uint8Array(audioBuffer),
    });

    if (!deepgramResponse.ok) {
      throw new Error(`Deepgram API error: ${deepgramResponse.statusText}`);
    }

    const transcriptionResult = await deepgramResponse.json();

    // Update progress
    await supabase
      .from('processing_jobs')
      .update({ progress: 80 })
      .eq('audio_file_id', audioFileId)
      .eq('job_type', 'transcription');

    // Extract transcription text and metadata
    const transcript = transcriptionResult.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = transcriptionResult.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;
    const words = transcriptionResult.results?.channels?.[0]?.alternatives?.[0]?.words || [];
    const wordCount = words.length;

    // Save transcription to database
    const { data: transcriptionData, error: insertError } = await supabase
      .from('transcriptions')
      .insert({
        audio_file_id: audioFileId,
        transcription_text: transcript,
        confidence_score: confidence,
        word_count: wordCount,
        deepgram_response: transcriptionResult,
        language: options.language || 'en',
        model: options.model || 'nova-2',
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save transcription: ${insertError.message}`);
    }

    // Update processing job to completed
    await supabase
      .from('processing_jobs')
      .update({ 
        status: 'completed', 
        progress: 100,
        result_id: transcriptionData.id 
      })
      .eq('audio_file_id', audioFileId)
      .eq('job_type', 'transcription');

    return new Response(
      JSON.stringify({
        success: true,
        transcription: transcriptionData,
        wordCount,
        confidence,
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('Transcription error:', error);

    // Update processing job to failed
    const { audioFileId } = await req.json().catch(() => ({}));
    if (audioFileId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase
        .from('processing_jobs')
        .update({ 
          status: 'failed', 
          error_message: error.message 
        })
        .eq('audio_file_id', audioFileId)
        .eq('job_type', 'transcription');
    }

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