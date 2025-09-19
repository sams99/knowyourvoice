import React, { useState } from 'react';
import { Copy, Download, Edit3, Save, X, FileText, Clock, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAppStore } from '../../store/useAppStore';

interface TranscriptionViewerProps {
  transcription: {
    id: string;
    transcription_text: string;
    confidence_score?: number;
    word_count?: number;
    language: string;
    model: string;
    created_at: string;
  };
}

export function TranscriptionViewer({ transcription }: TranscriptionViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription.transcription_text);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription.transcription_text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([transcription.transcription_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${transcription.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    // In a real application, you would update the transcription in the database
    setIsEditing(false);
    // For now, we'll just update the local state
    console.log('Saving edited transcription:', editedText);
  };

  const handleCancelEdit = () => {
    setEditedText(transcription.transcription_text);
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header with metadata */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <FileText size={24} />
            <span>Transcription</span>
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Copy size={18} />
              <span>{isCopied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={downloadAsText}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {isEditing ? <X size={18} /> : <Edit3 size={18} />}
              <span>{isEditing ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(transcription.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Target size={16} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Confidence</p>
              <p className="text-sm font-medium">
                {transcription.confidence_score ? 
                  `${Math.round(transcription.confidence_score * 100)}%` : 
                  'N/A'
                }
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Word Count</p>
            <p className="text-sm font-medium">{transcription.word_count || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Model</p>
            <p className="text-sm font-medium">{transcription.model}</p>
          </div>
        </div>

        {/* Transcription Text */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="Edit your transcription..."
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-blue-500">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {transcription.transcription_text}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}