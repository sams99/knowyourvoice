import React, { useState, useEffect } from 'react';
import { Upload, Mic, FileAudio, Brain, Sparkles, Play, Pause, Square } from 'lucide-react';
import { useAudioUpload } from '../../hooks/useAudioUpload';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useDirectTranscription } from '../../hooks/useDirectTranscription';
import { useDirectAnalysis } from '../../hooks/useDirectAnalysis';
import { useAppStore } from '../../store/useAppStore';
import { TranscriptionViewer } from '../transcription/TranscriptionViewer';
import { AnalysisDashboard } from '../analysis/AnalysisDashboard';

export function MainWorkflow() {
  const [autoProcessingStarted, setAutoProcessingStarted] = useState(false);
  
  const { currentAudioFile, currentTranscription, currentAnalysis, error, setError } = useAppStore();
  
  // Upload and recording hooks
  const { uploadFile, isUploading, uploadProgress } = useAudioUpload();
  const { recordingState, startRecording, stopRecording, saveRecording, isSaving } = useAudioRecorder();
  
  // Processing hooks
  const { transcribeAudio, isTranscribing, progress: transcribeProgress } = useDirectTranscription();
  const { analyzeTranscription, isAnalyzing, progress: analysisProgress } = useDirectAnalysis();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadFile(file);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Recording failed:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
    } catch (error) {
      console.error('Stop recording failed:', error);
    }
  };

  const handleSaveRecording = async () => {
    try {
      await saveRecording();
    } catch (error) {
      console.error('Save recording failed:', error);
    }
  };

  const handleTranscribe = async () => {
    if (!currentAudioFile) return;
    
    try {
      await transcribeAudio(currentAudioFile.id);
    } catch (error) {
      console.error('Transcription failed:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!currentTranscription) return;
    
    try {
      await analyzeTranscription(currentTranscription.id);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  // Auto-process: When audio file is uploaded/recorded, automatically transcribe
  useEffect(() => {
    if (currentAudioFile && !currentTranscription && !isTranscribing && !autoProcessingStarted) {
      console.log('🤖 Auto-transcription started...');
      setAutoProcessingStarted(true);
      
      // Add a small delay to ensure upload is fully complete
      setTimeout(() => {
        transcribeAudio(currentAudioFile.id).catch(error => {
          console.error('Auto-transcription failed:', error);
          setAutoProcessingStarted(false); // Reset flag on error
        });
      }, 1000);
    }
  }, [currentAudioFile, currentTranscription, isTranscribing, autoProcessingStarted]);

  // Auto-process: When transcription is complete, automatically analyze
  useEffect(() => {
    if (currentTranscription && !currentAnalysis && !isAnalyzing) {
      console.log('🧠 Auto-analysis started...');
      analyzeTranscription(currentTranscription.id).catch(error => {
        console.error('Auto-analysis failed:', error);
      });
    }
  }, [currentTranscription, currentAnalysis, isAnalyzing]);

  // Reset auto-processing flag when audio file changes
  useEffect(() => {
    setAutoProcessingStarted(false);
  }, [currentAudioFile]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-yellow-800 font-medium">📤 Uploading audio file...</p>
              <p className="text-yellow-600 text-sm">{uploadProgress}% complete</p>
            </div>
          </div>
          <div className="mt-3 w-full bg-yellow-200 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Auto-Processing Status */}
      {(isTranscribing || isAnalyzing) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-blue-800 font-medium">
                {isTranscribing ? '🤖 Auto-transcribing audio...' : '🧠 Auto-analyzing transcription...'}
              </p>
              <p className="text-blue-600 text-sm">
                {isTranscribing ? `${transcribeProgress}% complete` : `${analysisProgress}% complete`}
              </p>
            </div>
          </div>
          {(isTranscribing || isAnalyzing) && (
            <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${isTranscribing ? transcribeProgress : analysisProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Completion Status */}
      {currentAnalysis && !isTranscribing && !isAnalyzing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <p className="text-green-800 font-medium">✅ Auto-processing completed!</p>
              <p className="text-green-600 text-sm">Your sales call has been transcribed and analyzed automatically.</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!currentAudioFile && (
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Upload or Record Audio</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Upload File</h3>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileAudio className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span>
                  </p>
                  <p className="text-xs text-gray-500">MP3, WAV, M4A (MAX. 25MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
              {isUploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Recording */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Record Audio</h3>
              <div className="flex flex-col items-center justify-center h-40 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                <Mic className="w-10 h-10 mb-3 text-gray-400" />
                
                {!recordingState.audioBlob ? (
                  <button
                    onClick={recordingState.isRecording ? handleStopRecording : handleStartRecording}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
                      recordingState.isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {recordingState.isRecording ? (
                      <>
                        <Square size={18} />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Mic size={18} />
                        <span>Start Recording</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Recording complete! Duration: {Math.floor(recordingState.duration / 60)}:{(recordingState.duration % 60).toString().padStart(2, '0')}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveRecording}
                        disabled={isSaving}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center space-x-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <span>Save & Auto-Process</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio File Details */}
      {currentAudioFile && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Audio File</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">File:</span>
              <p className="font-medium truncate">{currentAudioFile.filename}</p>
            </div>
            <div>
              <span className="text-gray-500">Size:</span>
              <p className="font-medium">{(currentAudioFile.file_size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div>
              <span className="text-gray-500">Duration:</span>
              <p className="font-medium">{currentAudioFile.duration ? `${Math.round(currentAudioFile.duration)}s` : 'Unknown'}</p>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <p className="font-medium">{currentAudioFile.format}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transcription Section */}
      {currentAudioFile && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Transcription</h2>
            {!currentTranscription && !isTranscribing && (
              <button
                onClick={handleTranscribe}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <Play size={16} />
                <span>Start Transcription</span>
              </button>
            )}
          </div>

          {isTranscribing && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${transcribeProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {currentTranscription ? (
            <TranscriptionViewer transcription={currentTranscription} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileAudio className="mx-auto mb-2" size={24} />
              <p>Click "Start Transcription" to convert audio to text</p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Section */}
      {currentTranscription && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">AI Analysis</h2>
          

          {/* Analyze Button - Only show if not auto-processing */}
          {!isAnalyzing && (
            <div className="mb-6">
              <button
                onClick={handleAnalyze}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
              >
                <Sparkles size={18} />
                <span>Analysis</span>
              </button>
            </div>
          )}

          {/* Analysis Results */}
          {currentAnalysis && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-l-4 border-purple-500">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Brain className="mr-2" size={18} />
                Analysis Result ({currentAnalysis.analysis_type})
              </h3>
              
              {/* Use the new dashboard component */}
              <AnalysisDashboard analysisResponse={currentAnalysis.ai_response} />
            </div>
          )}

          {!currentAnalysis && !isAnalyzing && (
            <div className="text-center py-8 text-gray-500">
              <Brain className="mx-auto mb-2" size={24} />
              <p>Choose an analysis type and click "Analyze" to get AI insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
