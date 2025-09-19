import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

export interface AudioFile {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  duration?: number;
  format: string;
  mime_type: string;
  upload_type: 'upload' | 'recording';
  created_at: string;
}

export interface Transcription {
  id: string;
  audio_file_id: string;
  transcription_text: string;
  confidence_score?: number;
  word_count?: number;
  language: string;
  model: string;
  created_at: string;
}

export interface Analysis {
  id: string;
  transcription_id: string;
  system_prompt: string;
  ai_response: string;
  model_used: string;
  token_count?: number;
  analysis_type: string;
  created_at: string;
}

export interface ProcessingJob {
  id: string;
  job_type: 'transcription' | 'analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message?: string;
  audio_file_id?: string;
}

interface AppState {
  // Authentication
  user: User | null;
  setUser: (user: User | null) => void;

  // Current workflow state
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // Audio file management
  currentAudioFile: AudioFile | null;
  setCurrentAudioFile: (file: AudioFile | null) => void;

  // Processing states
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;

  processingJobs: ProcessingJob[];
  setProcessingJobs: (jobs: ProcessingJob[]) => void;
  updateProcessingJob: (jobId: string, updates: Partial<ProcessingJob>) => void;

  // Transcription and analysis
  currentTranscription: Transcription | null;
  setCurrentTranscription: (transcription: Transcription | null) => void;

  currentAnalysis: Analysis | null;
  setCurrentAnalysis: (analysis: Analysis | null) => void;

  // History
  audioFiles: AudioFile[];
  setAudioFiles: (files: AudioFile[]) => void;

  transcriptions: Transcription[];
  setTranscriptions: (transcriptions: Transcription[]) => void;

  analyses: Analysis[];
  setAnalyses: (analyses: Analysis[]) => void;

  // UI state
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;

  activeTab: 'main' | 'history';
  setActiveTab: (tab: 'main' | 'history') => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;

  // Reset functions
  resetWorkflow: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Authentication
  user: null,
  setUser: (user) => set({ user }),

  // Current workflow state
  currentStep: 0,
  setCurrentStep: (step) => set({ currentStep: step }),

  // Audio file management
  currentAudioFile: null,
  setCurrentAudioFile: (file) => set({ currentAudioFile: file }),

  // Processing states
  isProcessing: false,
  setIsProcessing: (processing) => set({ isProcessing: processing }),

  processingJobs: [],
  setProcessingJobs: (jobs) => set({ processingJobs: jobs }),
  updateProcessingJob: (jobId, updates) => {
    const { processingJobs } = get();
    const updatedJobs = processingJobs.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    );
    set({ processingJobs: updatedJobs });
  },

  // Transcription and analysis
  currentTranscription: null,
  setCurrentTranscription: (transcription) => set({ currentTranscription: transcription }),

  currentAnalysis: null,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),

  // History
  audioFiles: [],
  setAudioFiles: (files) => set({ audioFiles: files }),

  transcriptions: [],
  setTranscriptions: (transcriptions) => set({ transcriptions }),

  analyses: [],
  setAnalyses: (analyses) => set({ analyses }),

  // UI state
  showAuthModal: false,
  setShowAuthModal: (show) => set({ showAuthModal: show }),

  activeTab: 'main',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Error handling
  error: null,
  setError: (error) => set({ error }),

  // Reset functions
  resetWorkflow: () => set({
    currentStep: 0,
    currentAudioFile: null,
    currentTranscription: null,
    currentAnalysis: null,
    isProcessing: false,
    error: null,
  }),
}));