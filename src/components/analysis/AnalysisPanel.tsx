import { useState, useEffect } from 'react';
import { Brain, Sparkles, Clock, Zap, History } from 'lucide-react';
import { useDirectAnalysis } from '../../hooks/useDirectAnalysis';
import { useAppStore } from '../../store/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { AnalysisDashboard } from './AnalysisDashboard';

interface AnalysisPanelProps {
  transcriptionId: string;
  onAnalysisComplete?: (analysis: any) => void;
}

export function AnalysisPanel({ transcriptionId, onAnalysisComplete }: AnalysisPanelProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);
  
  const { analyzeTranscription, isAnalyzing, progress, getAnalysisHistory } = useDirectAnalysis();
  const { currentAnalysis: storeAnalysis } = useAppStore();

  // Load existing analyses when component mounts or transcription changes
  useEffect(() => {
    const loadAnalysisHistory = async () => {
      try {
        const history = await getAnalysisHistory(transcriptionId);
        setAnalysisHistory(history);
        
        // If there's a current analysis in store, use it
        if (storeAnalysis && storeAnalysis.transcription_id === transcriptionId) {
          setCurrentAnalysis(storeAnalysis);
        } else if (history && history.length > 0) {
          // Otherwise, use the most recent analysis
          setCurrentAnalysis(history[0]);
        }
      } catch (error) {
        console.error('Error loading analysis history:', error);
      }
    };

    if (transcriptionId) {
      loadAnalysisHistory();
    }
  }, [transcriptionId, storeAnalysis, getAnalysisHistory]);

  const handleAnalyze = async () => {
    try {
      const analysis = await analyzeTranscription(transcriptionId);
      
      setCurrentAnalysis(analysis);
      onAnalysisComplete?.(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Analysis Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Brain size={24} className="text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Sales Call Analysis</h3>
        </div>

        {/* Analyze Button */}
        <div className="space-y-4">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
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

          {/* Use the new dashboard component */}
          <AnalysisDashboard analysisResponse={currentAnalysis.ai_response} />

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

      {/* Analysis History */}
      {analysisHistory.length > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <History size={20} className="text-gray-600" />
            <h4 className="text-lg font-semibold text-gray-900">Previous Analyses</h4>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {analysisHistory.slice(1).map((analysis) => (
              <div
                key={analysis.id}
                onClick={() => setCurrentAnalysis(analysis)}
                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-900 capitalize">
                    {analysis.analysis_type} Analysis
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {analysis.ai_response.substring(0, 100)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Analysis Yet */}
      {!currentAnalysis && !isAnalyzing && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Brain className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
          <p className="text-gray-500">Choose an analysis type above and click "Analyze with AI" to get started.</p>
        </div>
      )}
    </div>
  );
}