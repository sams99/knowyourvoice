import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';

const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/flac', 'audio/ogg'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function useAudioUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { setCurrentAudioFile, setError } = useAppStore();
  const { user } = useAuth();

  const validateFile = (file: File) => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      throw new Error('Unsupported file format. Please upload MP3, WAV, M4A, FLAC, or OGG files.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 25MB limit.');
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      throw new Error('Please sign in to upload files');
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      validateFile(file);

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      setUploadProgress(25);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(50);

      // Get audio duration (if possible)
      const duration = await getAudioDuration(file);

      setUploadProgress(75);

      // Save file metadata to database
      const { data: audioFileData, error: dbError } = await supabase
        .from('audio_files')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_path: filePath,
          file_size: file.size,
          duration,
          format: fileExt || '',
          mime_type: file.type,
          upload_type: 'upload',
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('audio-files').remove([filePath]);
        throw new Error(`Failed to save file metadata: ${dbError.message}`);
      }

      setUploadProgress(100);
      setCurrentAudioFile(audioFileData);

      return audioFileData;
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getAudioDuration = (file: File): Promise<number | undefined> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(undefined);
      });

      audio.src = objectUrl;
    });
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    validateFile,
  };
}