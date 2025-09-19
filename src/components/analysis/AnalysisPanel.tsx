import React, { useState } from 'react';
import { Brain, Sparkles, Send, Clock, Zap } from 'lucide-react';
import { useDirectAnalysis, ANALYSIS_PROMPTS } from '../../hooks/useDirectAnalysis';
import { formatDistanceToNow } from 'date-fns';

interface AnalysisPanelProps {
  transcriptionId: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export function AnalysisPanel({ transcriptionId, onAnalysisComplete }: AnalysisPanelProps) {
  const [selectedPromptType, setSelectedPromptType] = useState<keyof typeof ANALYSIS_PROMPTS>('summary');
  const [customPrompt, setCustomPrompt] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  
  const { analyzeTranscription, isAnalyzing, progress } = useDirectAnalysis();

  const getCurrentPrompt = () => {
    if (selectedPromptType === 'custom') {
      return customPrompt;
    }
    return ANALYSIS_PROMPTS[selectedPromptType];
  };

  const handleAnalyze = async () => {
    const prompt = getCurrentPrompt();
    if (!prompt.trim()) {
      return;
    }

    try {
      const analysis = await analyzeTranscription(transcriptionId, prompt, {
        analysisType: selectedPromptType,
      });
      
      setCurrentAnalysis(analysis);
      onAnalysisComplete?.(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const promptTypes = [
    { key: 'summary', label: 'Summary', icon: '📝', description: 'Get a concise overview' },
    { key: 'sentiment', label: 'Sentiment', icon: '😊', description: 'Analyze emotional tone' },
    { key: 'keywords', label: 'Keywords', icon: '🏷️', description: 'Extract key terms' },
    { key: 'actionItems', label: 'Action Items', icon: '✅', description: 'Find tasks and decisions' },
    { key: 'insights', label: 'Insights', icon: '💡', description: 'Deep analysis and takeaways' },
    { key: 'custom', label: 'Custom', icon: '⚙️', description: 'Write your own prompt' },
  ] as const;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Analysis Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Brain size={24} className="text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">AI Analysis</h3>
        </div>

        {/* Prompt Type Selection */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {promptTypes.map(({ key, label, icon, description }) => (
              <button
                key={key}
                onClick={() => setSelectedPromptType(key)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${selectedPromptType === key 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium">{label}</span>
                </div>
                <p className="text-xs text-gray-600">{description}</p>
              </button>
            ))}
          </div>

          {/* Custom Prompt Input */}
          {selectedPromptType === 'custom' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Custom Analysis Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom analysis prompt here..."
                className="w-full h-32 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Current Prompt Preview */}
          {selectedPromptType !== 'custom' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Analysis Prompt:</p>
              <p className="text-sm text-gray-600">{getCurrentPrompt()}</p>
            </div>
          )}

          {/* Analyze Button */}
          <div className="space-y-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !getCurrentPrompt().trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing... {progress}%</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Analyze with AI (Gemini Flash-2.0)</span>
                </>
              )}
            </button>
            {isAnalyzing && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {currentAnalysis && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Zap size={20} className="text-yellow-500" />
              <span>Analysis Results</span>
            </h4>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>{formatDistanceToNow(new Date(currentAnalysis.created_at), { addSuffix: true })}</span>
              </div>
              {currentAnalysis.token_count && (
                <span>{currentAnalysis.token_count} tokens</span>
              )}
            </div>
          </div>

          <div className="prose max-w-none">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-l-4 border-purple-500">
              <pre className="text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                {currentAnalysis.ai_response}
              </pre>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Analysis Type:</strong> {currentAnalysis.analysis_type} | 
              <strong> Model:</strong> {currentAnalysis.model_used}
              {currentAnalysis.processing_time && (
                <> | <strong>Processing Time:</strong> {currentAnalysis.processing_time.toFixed(2)}s</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}