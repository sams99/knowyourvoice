import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      audio_files: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          file_path: string;
          file_size: number;
          duration?: number;
          format: string;
          mime_type: string;
          upload_type: 'upload' | 'recording';
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          filename: string;
          file_path: string;
          file_size: number;
          duration?: number;
          format: string;
          mime_type: string;
          upload_type: 'upload' | 'recording';
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          filename?: string;
          file_path?: string;
          file_size?: number;
          duration?: number;
          format?: string;
          mime_type?: string;
          upload_type?: 'upload' | 'recording';
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      transcriptions: {
        Row: {
          id: string;
          audio_file_id: string;
          transcription_text: string;
          confidence_score?: number;
          processing_time?: number;
          word_count?: number;
          deepgram_response?: Record<string, any>;
          language: string;
          model: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          audio_file_id: string;
          transcription_text: string;
          confidence_score?: number;
          processing_time?: number;
          word_count?: number;
          deepgram_response?: Record<string, any>;
          language?: string;
          model?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          audio_file_id?: string;
          transcription_text?: string;
          confidence_score?: number;
          processing_time?: number;
          word_count?: number;
          deepgram_response?: Record<string, any>;
          language?: string;
          model?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_analyses: {
        Row: {
          id: string;
          transcription_id: string;
          system_prompt: string;
          ai_response: string;
          model_used: string;
          token_count?: number;
          processing_time?: number;
          analysis_type: string;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transcription_id: string;
          system_prompt: string;
          ai_response: string;
          model_used?: string;
          token_count?: number;
          processing_time?: number;
          analysis_type?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transcription_id?: string;
          system_prompt?: string;
          ai_response?: string;
          model_used?: string;
          token_count?: number;
          processing_time?: number;
          analysis_type?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          default_prompts: any[];
          preferred_model: string;
          audio_quality: string;
          auto_analyze: boolean;
          notification_preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_prompts?: any[];
          preferred_model?: string;
          audio_quality?: string;
          auto_analyze?: boolean;
          notification_preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_prompts?: any[];
          preferred_model?: string;
          audio_quality?: string;
          auto_analyze?: boolean;
          notification_preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      processing_jobs: {
        Row: {
          id: string;
          user_id: string;
          audio_file_id?: string;
          job_type: 'transcription' | 'analysis';
          status: 'pending' | 'processing' | 'completed' | 'failed';
          progress: number;
          error_message?: string;
          result_id?: string;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          audio_file_id?: string;
          job_type: 'transcription' | 'analysis';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          progress?: number;
          error_message?: string;
          result_id?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          audio_file_id?: string;
          job_type?: 'transcription' | 'analysis';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          progress?: number;
          error_message?: string;
          result_id?: string;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};