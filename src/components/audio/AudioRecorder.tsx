import React from 'react';
import { Mic, Square, Pause, Play, Save, Trash2, MicOff } from 'lucide-react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useAppStore } from '../../store/useAppStore';

export function AudioRecorder() {
  const {
    recordingState,
    isSaving,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveRecording,
    discardRecording,
    formatDuration,
  } = useAudioRecorder();

  const { error } = useAppStore();

  const { isRecording, isPaused, duration, audioUrl } = recordingState;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Recording Controls */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center space-y-6">
          {/* Recording Status */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">Audio Recorder</h3>
            <div className="flex items-center justify-center space-x-2">
              {isRecording ? (
                <>
                  <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                  <span className="text-lg font-mono text-gray-700">
                    {formatDuration(duration)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {isPaused ? 'Paused' : 'Recording...'}
                  </span>
                </>
              ) : (
                <span className="text-gray-500">Ready to record</span>
              )}
            </div>
          </div>

          {/* Main Recording Button */}
          <div className="flex justify-center">
            {!isRecording && !audioUrl ? (
              <button
                onClick={startRecording}
                className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <Mic size={32} />
              </button>
            ) : isRecording ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="w-16 h-16 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {isPaused ? <Play size={24} /> : <Pause size={24} />}
                </button>
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <Square size={24} />
                </button>
              </div>
            ) : null}
          </div>

          {/* Recording Actions */}
          {!isRecording && audioUrl && (
            <div className="space-y-4">
              <audio
                controls
                src={audioUrl}
                className="w-full"
              />
              <div className="flex justify-center space-x-4">
                <button
                  onClick={saveRecording}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Save size={18} />
                  <span>{isSaving ? 'Saving...' : 'Save Recording'}</span>
                </button>
                <button
                  onClick={discardRecording}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  <span>Discard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <MicOff size={16} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Recording Tips:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Make sure your microphone is enabled</li>
              <li>Find a quiet environment for best quality</li>
              <li>You can pause and resume recording at any time</li>
              <li>Review your recording before saving</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <MicOff size={16} className="text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}