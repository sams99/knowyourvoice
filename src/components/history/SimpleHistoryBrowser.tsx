import React, { useEffect, useState } from 'react';
import { Eye, FileAudio, Calendar, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';
import { formatDistanceToNow } from 'date-fns';

interface AudioRecord {
  id: string;
  filename: string;
  file_size: number;
  duration?: number;
  format: string;
  upload_type: string;
  created_at: string;
  transcription?: {
    id: string;
    transcription_text: string;
    confidence_score: number;
    created_at: string;
  } | null;
  analysis?: {
    id: string;
    ai_response: string;
    analysis_type: string;
    created_at: string;
  } | null;
}

export function SimpleHistoryBrowser() {
  const [records, setRecords] = useState<AudioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { setCurrentAudioFile, setCurrentTranscription, setCurrentAnalysis, setActiveTab } = useAppStore();

  const loadRecords = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch audio files with their latest transcription and analysis
      const { data: audioFiles, error } = await supabase
        .from('audio_files')
        .select(`
          *,
          transcriptions(
            id,
            transcription_text,
            confidence_score,
            created_at,
            ai_analyses(
              id,
              ai_response,
              analysis_type,
              created_at
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading records:', error);
        return;
      }

      // Transform the data to get one record per audio file
      const transformedRecords: AudioRecord[] = audioFiles.map(file => {
        const latestTranscription = file.transcriptions?.[0] || null;
        const latestAnalysis = latestTranscription?.ai_analyses?.[0] || null;

        return {
          id: file.id,
          filename: file.filename,
          file_size: file.file_size,
          duration: file.duration,
          format: file.format,
          upload_type: file.upload_type,
          created_at: file.created_at,
          transcription: latestTranscription ? {
            id: latestTranscription.id,
            transcription_text: latestTranscription.transcription_text,
            confidence_score: latestTranscription.confidence_score,
            created_at: latestTranscription.created_at,
          } : null,
          analysis: latestAnalysis ? {
            id: latestAnalysis.id,
            ai_response: latestAnalysis.ai_response,
            analysis_type: latestAnalysis.analysis_type,
            created_at: latestAnalysis.created_at,
          } : null,
        };
      });

      setRecords(transformedRecords);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecords();
    }
  }, [user]);

  const handleViewRecord = (record: AudioRecord) => {
    // Set the audio file in the store
    setCurrentAudioFile({
      id: record.id,
      filename: record.filename,
      file_path: `${record.id}/${record.filename}`, // Reconstruct path
      file_size: record.file_size,
      duration: record.duration,
      format: record.format,
      mime_type: `audio/${record.format}`, // Reconstruct mime type
      upload_type: record.upload_type as 'upload' | 'recording',
      created_at: record.created_at,
    });

    // Set transcription if exists
    if (record.transcription) {
      setCurrentTranscription({
        id: record.transcription.id,
        audio_file_id: record.id,
        transcription_text: record.transcription.transcription_text,
        confidence_score: record.transcription.confidence_score,
        language: 'en', // Default
        model: 'nova-2', // Default
        created_at: record.transcription.created_at,
      });
    } else {
      setCurrentTranscription(null);
    }

    // Set analysis if exists
    if (record.analysis) {
      setCurrentAnalysis({
        id: record.analysis.id,
        transcription_id: record.transcription!.id,
        system_prompt: '', // We don't store the system prompt in this view
        ai_response: record.analysis.ai_response,
        model_used: 'gemini-2.0-flash-exp',
        token_count: 0,
        processing_time: 0,
        analysis_type: record.analysis.analysis_type,
        created_at: record.analysis.created_at,
      });
    } else {
      setCurrentAnalysis(null);
    }

    // Switch to main tab to view the record
    setActiveTab('main');
  };

  const getStatusBadge = (record: AudioRecord) => {
    if (record.analysis) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Complete</span>;
    } else if (record.transcription) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Transcribed</span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Uploaded</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <FileAudio className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
        <p className="text-gray-500">Upload some audio files to see them here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Audio Records</h2>
          <p className="text-sm text-gray-600 mt-1">{records.length} record(s) found</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {records.map((record) => (
            <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <FileAudio className="text-gray-400" size={20} />
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {record.filename}
                    </h3>
                    {getStatusBadge(record)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <span>Size:</span>
                      <span>{(record.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Duration:</span>
                      <span>{record.duration ? `${Math.round(record.duration)}s` : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Type:</span>
                      <span className="uppercase">{record.format}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Processing Status */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${record.transcription ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>Transcription</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${record.analysis ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span>Analysis</span>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => handleViewRecord(record)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Eye size={16} className="mr-2" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
