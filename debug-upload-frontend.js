// Debug Upload Function - Add to browser console
// This will help us see exactly what's happening during upload

// 1. Check current user in browser console
console.log('=== UPLOAD DEBUG ===');
console.log('1. Checking authentication...');

// Get the supabase client from your app
// You can access this in the browser console when your app is running
const checkAuth = async () => {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session:', session);
    console.log('Session error:', sessionError);
    console.log('User ID:', session?.user?.id);
    console.log('User email:', session?.user?.email);
    
    if (!session) {
        console.error('❌ No session found - user not authenticated');
        return false;
    }
    
    // Test database connection
    console.log('2. Testing database access...');
    
    const { data: testData, error: testError } = await supabase
        .from('audio_files')
        .select('id')
        .limit(1);
    
    console.log('Database test result:', testData);
    console.log('Database test error:', testError);
    
    // Test storage access
    console.log('3. Testing storage access...');
    
    const testFilePath = `${session.user.id}/test.txt`;
    const testFile = new Blob(['test'], { type: 'text/plain' });
    
    const { error: storageError } = await supabase.storage
        .from('audio-files')
        .upload(testFilePath, testFile);
    
    console.log('Storage test error:', storageError);
    
    if (!storageError) {
        console.log('✅ Storage upload works - cleaning up test file');
        await supabase.storage.from('audio-files').remove([testFilePath]);
    }
    
    return true;
};

// 4. Test audio file upload
const testAudioUpload = async (file) => {
    console.log('4. Testing audio file upload...');
    console.log('File:', file);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        console.error('❌ Not authenticated');
        return;
    }
    
    const filePath = `${session.user.id}/test_${Date.now()}.mp3`;
    
    // Try storage upload
    console.log('Uploading to path:', filePath);
    const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file);
    
    console.log('Upload error:', uploadError);
    
    if (uploadError) {
        console.error('❌ Storage upload failed:', uploadError);
        return;
    }
    
    // Try database insert
    console.log('Inserting metadata to database...');
    const { data: dbData, error: dbError } = await supabase
        .from('audio_files')
        .insert({
            user_id: session.user.id,
            filename: file.name,
            file_path: filePath,
            file_size: file.size,
            format: 'mp3',
            mime_type: file.type,
            upload_type: 'upload',
        })
        .select()
        .single();
    
    console.log('Database result:', dbData);
    console.log('Database error:', dbError);
    
    if (dbError) {
        console.error('❌ Database insert failed:', dbError);
        // Clean up storage file
        await supabase.storage.from('audio-files').remove([filePath]);
    } else {
        console.log('✅ Upload successful!');
    }
};

// Run the authentication check
checkAuth();

console.log('=== DEBUG FUNCTIONS LOADED ===');
console.log('Run: checkAuth() - to check authentication');
console.log('Run: testAudioUpload(yourMp3File) - to test file upload');
console.log('Example: testAudioUpload(document.querySelector("input[type=file]").files[0])');

