// Mock Transcription Function - Add this to test the UI
// Copy this into your browser console to test transcription without APIs

// Mock function that simulates transcription
const mockTranscription = async (audioFileId) => {
    console.log('🎙️ Starting mock transcription for file:', audioFileId);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock transcription result
    const mockResult = {
        id: 'mock-transcription-' + Date.now(),
        audio_file_id: audioFileId,
        transcription_text: "This is a mock transcription. In a real scenario, this would be the actual transcribed text from your audio file using Deepgram AI. The transcription would include the spoken words, with high accuracy and confidence scores.",
        confidence_score: 0.95,
        word_count: 32,
        language: 'en',
        model: 'nova-2',
        created_at: new Date().toISOString()
    };
    
    // Save mock transcription to database
    const { data, error } = await supabase
        .from('transcriptions')
        .insert(mockResult)
        .select()
        .single();
    
    if (error) {
        console.error('Failed to save mock transcription:', error);
        throw error;
    }
    
    console.log('✅ Mock transcription completed:', data);
    return data;
};

// Test the mock transcription
// Usage: mockTranscription('your-audio-file-id')

