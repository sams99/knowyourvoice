import React, { useState } from 'react';
import { Upload, Mic, FileAudio, Brain, Sparkles, Play, Pause, Square } from 'lucide-react';
import { useAudioUpload } from '../../hooks/useAudioUpload';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useDirectTranscription } from '../../hooks/useDirectTranscription';
import { useDirectAnalysis, ANALYSIS_PROMPTS } from '../../hooks/useDirectAnalysis';
import { useAppStore } from '../../store/useAppStore';
import { TranscriptionViewer } from '../transcription/TranscriptionViewer';

export function MainWorkflow() {
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<keyof typeof ANALYSIS_PROMPTS>('summary');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const { currentAudioFile, currentTranscription, currentAnalysis, error, setError } = useAppStore();
  
  // Upload and recording hooks
  const { uploadFile, isUploading, uploadProgress } = useAudioUpload();
  const { startRecording, stopRecording, isRecording, audioBlob } = useAudioRecorder();
  
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
      const prompt = selectedAnalysisType === 'custom' ? customPrompt : ANALYSIS_PROMPTS[selectedAnalysisType];
      if (!prompt.trim()) return;
      
      await analyzeTranscription(currentTranscription.id, prompt, {
        analysisType: selectedAnalysisType,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const getCurrentPrompt = () => {
    return selectedAnalysisType === 'custom' ? customPrompt : ANALYSIS_PROMPTS[selectedAnalysisType];
  };

  const analysisTypes = [
    { key: 'summary', label: 'Summary', icon: '📝' },
    { key: 'sentiment', label: 'Sentiment', icon: '😊' },
    { key: 'keywords', label: 'Keywords', icon: '🏷️' },
    { key: 'actionItems', label: 'Action Items', icon: '✅' },
    { key: 'insights', label: 'Insights', icon: '💡' },
    { key: 'custom', label: 'Custom', icon: '⚙️' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
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
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isRecording ? (
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
            {!currentTranscription && (
              <button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                {isTranscribing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Transcribing... {transcribeProgress}%</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Start Transcription</span>
                  </>
                )}
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
          
          {/* Analysis Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Analysis Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {analysisTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setSelectedAnalysisType(type.key)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedAnalysisType === type.key
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          {selectedAnalysisType === 'custom' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom analysis prompt..."
                className="w-full h-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Analyze Button */}
          <div className="mb-6">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !getCurrentPrompt().trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing... {analysisProgress}%</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Analyze with Gemini Flash-2.0</span>
                </>
              )}
            </button>

            {isAnalyzing && (
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {currentAnalysis && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-l-4 border-purple-500">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Brain className="mr-2" size={18} />
                Analysis Result ({currentAnalysis.analysis_type})
              </h3>
              <pre className="text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                {currentAnalysis.ai_response}
              </pre>
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
