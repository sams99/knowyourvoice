import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { useAppStore } from './store/useAppStore';
import { useDirectTranscription } from './hooks/useDirectTranscription';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { AuthModal } from './components/auth/AuthModal';
import { AudioUploader } from './components/audio/AudioUploader';
import { AudioRecorder } from './components/audio/AudioRecorder';
import { TranscriptionViewer } from './components/transcription/TranscriptionViewer';
import { AnalysisPanel } from './components/analysis/AnalysisPanel';
import { HistoryBrowser } from './components/history/HistoryBrowser';

function App() {
  const { isAuthenticated } = useAuth();
  const { transcribeAudio, isTranscribing, progress } = useDirectTranscription();
  const { 
    activeTab, 
    currentAudioFile, 
    currentTranscription,
    showAuthModal,
    setShowAuthModal 
  } = useAppStore();

  const renderTabContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-medium text-gray-900">Authentication Required</h3>
            <p className="text-gray-600 max-w-md">
              Please sign in to access the audio transcription and AI analysis features.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Audio File</h2>
              <p className="text-gray-600">
                Upload your audio file to get started with transcription and AI analysis.
              </p>
            </div>
            <AudioUploader />
          </div>
        );

      case 'record':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Record Audio</h2>
              <p className="text-gray-600">
                Record audio directly from your microphone for transcription and analysis.
              </p>
            </div>
            <AudioRecorder />
          </div>
        );

      case 'transcribe':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Transcription</h2>
              <p className="text-gray-600">
                {currentAudioFile ? 
                  `Transcribing: ${currentAudioFile.filename}` :
                  'No audio file selected for transcription.'
                }
              </p>
            </div>
            {currentTranscription ? (
              <TranscriptionViewer transcription={currentTranscription} />
            ) : currentAudioFile ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Ready to transcribe your audio file.</p>
                <div className="space-y-4">
                  <button 
                    onClick={() => transcribeAudio(currentAudioFile.id)}
                    disabled={isTranscribing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {isTranscribing ? `Transcribing... ${progress}%` : 'Start Transcription'}
                  </button>
                  {isTranscribing && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Please upload or record an audio file first.</p>
              </div>
            )}
          </div>
        );

      case 'analyze':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Analysis</h2>
              <p className="text-gray-600">
                {currentTranscription ? 
                  'Analyze your transcription with AI-powered insights.' :
                  'Complete transcription first to enable AI analysis.'
                }
              </p>
            </div>
            {currentTranscription ? (
              <AnalysisPanel 
                transcriptionId={currentTranscription.id}
                onAnalysisComplete={(analysis) => {
                  console.log('Analysis completed:', analysis);
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Please complete transcription first.</p>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <HistoryBrowser />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>

      <AuthModal />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;