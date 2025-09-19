import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, FileAudio, FileText, Brain, Download, Trash2, Play } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAppStore } from '../../store/useAppStore';

interface HistoryItem {
  id: string;
  type: 'audio' | 'transcription' | 'analysis';
  title: string;
  content: string;
  created_at: string;
  metadata?: any;
}

export function HistoryBrowser() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'audio' | 'transcription' | 'analysis'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { setCurrentAudioFile, setActiveTab } = useAppStore();

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [historyItems, searchQuery, typeFilter, dateFilter]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);

      // Load audio files
      const { data: audioFiles } = await supabase
        .from('audio_files')
        .select('*')
        .order('created_at', { ascending: false });

      // Load transcriptions with audio file info
      const { data: transcriptions } = await supabase
        .from('transcriptions')
        .select(`
          *,
          audio_files (filename)
        `)
        .order('created_at', { ascending: false });

      // Load analyses with transcription and audio file info
      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select(`
          *,
          transcriptions (
            id,
            audio_files (filename)
          )
        `)
        .order('created_at', { ascending: false });

      const items: HistoryItem[] = [];

      // Add audio files
      audioFiles?.forEach(file => {
        items.push({
          id: file.id,
          type: 'audio',
          title: file.filename,
          content: `${file.format.toUpperCase()} • ${formatFileSize(file.file_size)} • ${file.upload_type}`,
          created_at: file.created_at,
          metadata: file,
        });
      });

      // Add transcriptions
      transcriptions?.forEach(transcript => {
        items.push({
          id: transcript.id,
          type: 'transcription',
          title: `Transcription of ${transcript.audio_files?.filename || 'Unknown'}`,
          content: transcript.transcription_text.substring(0, 150) + '...',
          created_at: transcript.created_at,
          metadata: transcript,
        });
      });

      // Add analyses
      analyses?.forEach(analysis => {
        const filename = analysis.transcriptions?.audio_files?.filename || 'Unknown';
        items.push({
          id: analysis.id,
          type: 'analysis',
          title: `${analysis.analysis_type} Analysis of ${filename}`,
          content: analysis.ai_response.substring(0, 150) + '...',
          created_at: analysis.created_at,
          metadata: analysis,
        });
      });

      // Sort by date
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setHistoryItems(items);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = historyItems;

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(item => new Date(item.created_at) >= cutoffDate);
    }

    setFilteredItems(filtered);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <FileAudio size={20} className="text-blue-600" />;
      case 'transcription':
        return <FileText size={20} className="text-green-600" />;
      case 'analysis':
        return <Brain size={20} className="text-purple-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'audio':
        return 'bg-blue-100 text-blue-800';
      case 'transcription':
        return 'bg-green-100 text-green-800';
      case 'analysis':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectAudioFile = async (item: HistoryItem) => {
    if (item.type === 'audio') {
      // Set this audio file as the current one
      setCurrentAudioFile(item.metadata);
      
      // Fetch existing transcription if it exists
      try {
        const { data: transcriptions, error } = await supabase
          .from('transcriptions')
          .select('*')
          .eq('audio_file_id', item.metadata.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching transcription:', error);
        } else if (transcriptions && transcriptions.length > 0) {
          // Set the transcription if it exists
          setCurrentTranscription(transcriptions[0]);
        } else {
          // Clear transcription if none exists
          setCurrentTranscription(null);
        }
      } catch (error) {
        console.error('Error fetching transcription:', error);
        setCurrentTranscription(null);
      }
      
      // Switch to transcribe tab to view the file
      setActiveTab('transcribe');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">History</h2>
        <button
          onClick={loadHistory}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="audio">Audio Files</option>
              <option value="transcription">Transcriptions</option>
              <option value="analysis">Analyses</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">
              {historyItems.length === 0
                ? "You haven't created any audio files, transcriptions, or analyses yet."
                : "No items match your current filters. Try adjusting your search criteria."
              }
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{item.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                      <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.type === 'audio' && (
                    <button
                      onClick={() => handleSelectAudioFile(item)}
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="View Audio File"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  <button
                    className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}