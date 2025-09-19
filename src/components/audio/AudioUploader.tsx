import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, AlertCircle, CheckCircle } from 'lucide-react';
import { useAudioUpload } from '../../hooks/useAudioUpload';
import { useAppStore } from '../../store/useAppStore';

export function AudioUploader() {
  const { uploadFile, isUploading, uploadProgress } = useAudioUpload();
  const { error } = useAppStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      try {
        await uploadFile(file);
      } catch (error) {
        console.error('Upload failed:', error);
        // Check if it's a bucket not found error
        if (error instanceof Error && error.message.includes('Bucket not found')) {
          useAppStore.getState().setError(
            'Storage bucket not found. Please create the "audio-files" bucket in your Supabase dashboard. See README for setup instructions.'
          );
        }
      }
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/mp4': ['.m4a'],
      'audio/flac': ['.flac'],
      'audio/ogg': ['.ogg'],
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024, // 25MB
    disabled: isUploading,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">Uploading...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              {isDragActive ? (
                <Upload size={32} className="text-blue-600" />
              ) : (
                <FileAudio size={32} className="text-gray-400" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your audio file here' : 'Upload Audio File'}
              </p>
              <p className="text-gray-600">
                Drag & drop your audio file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports MP3, WAV, M4A, FLAC, OGG (max 25MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File rejection errors */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-red-800 font-medium">Upload Error</p>
              {fileRejections.map(({ file, errors }) => (
                <div key={file.name} className="text-sm text-red-700">
                  <p className="font-medium">{file.name}</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error) => (
                      <li key={error.code}>
                        {error.code === 'file-too-large' 
                          ? `File is too large (${formatFileSize(file.size)}). Maximum size is 25MB.`
                          : error.message
                        }
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* General upload error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}