# Audio Transcription and AI Analysis App

A comprehensive web application for uploading, recording, transcribing, and analyzing audio files using Deepgram AI for transcription and Google Gemini AI for analysis.

## Features

- **Audio Upload**: Drag-and-drop interface supporting MP3, WAV, M4A, FLAC, and OGG formats (up to 25MB)
- **Audio Recording**: Browser-based recording with real-time waveform visualization
- **AI Transcription**: High-accuracy speech-to-text using Deepgram API with confidence scores
- **AI Analysis**: Intelligent analysis of transcriptions using Google Gemini AI with preset and custom prompts
- **History Management**: Complete history of all audio files, transcriptions, and analyses
- **User Authentication**: Secure user accounts with Supabase Auth
- **Real-time Processing**: Live updates on transcription and analysis progress
- **Export Options**: Download transcriptions and analyses in various formats

## Tech Stack

- **Frontend**: React 18+ with TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Storage, Edge Functions)
- **AI Services**: Deepgram API (transcription), Google Gemini AI (analysis)
- **State Management**: Zustand
- **File Handling**: React Dropzone
- **Audio Recording**: MediaRecorder API

## Prerequisites

Before setting up the application, you'll need:

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Deepgram API Key**: Sign up at [deepgram.com](https://deepgram.com)
3. **Google Gemini API Key**: Get access at [ai.google.dev](https://ai.google.dev)
4. **Node.js**: Version 18+ installed

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project
2. In your Supabase dashboard, go to **Settings** > **API** to get your URL and anon key
3. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

The application includes a complete database migration. To set up the database:

1. In your Supabase dashboard, go to the **SQL Editor**
2. Run the migration script found in `supabase/migrations/create_audio_transcription_schema.sql`

This will create all necessary tables, relationships, Row Level Security policies, and indexes.

### 4. Storage Setup

1. In your Supabase dashboard, go to **Storage** in the left sidebar
2. Click **New bucket**
3. Enter the bucket name: `audio-files` (exactly as shown, case-sensitive)
4. Set **Public bucket** to OFF (keep it private)
5. Set **File size limit** to 26214400 (25MB in bytes)
6. Set **Allowed MIME types** to: `audio/mpeg,audio/wav,audio/mp4,audio/flac,audio/ogg`
7. Click **Create bucket**
8. The bucket policies will be automatically applied via the database migration

**Important**: The bucket name must be exactly `audio-files` or the application will not work.

### 5. Edge Functions Setup

The application uses Supabase Edge Functions for API integrations. To set up:

1. In your Supabase dashboard, go to **Edge Functions**
2. Create the environment variables for your API keys:
   - `DEEPGRAM_API_KEY`: Your Deepgram API key
   - `GEMINI_API_KEY`: Your Google Gemini API key

### 6. API Keys Setup

#### Deepgram API Key
1. Sign up at [deepgram.com](https://deepgram.com)
2. Create a new project and get your API key
3. Add it to your Supabase Edge Functions environment variables

#### Google Gemini API Key
1. Go to [ai.google.dev](https://ai.google.dev)
2. Create a new project and enable the Generative AI API
3. Generate an API key
4. Add it to your Supabase Edge Functions environment variables

### 7. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage Guide

### 1. Authentication
- Sign up for a new account or sign in with existing credentials
- All data is securely tied to your user account

### 2. Upload Audio
- Use the **Upload** tab to drag-and-drop audio files
- Supported formats: MP3, WAV, M4A, FLAC, OGG (max 25MB)
- Files are stored securely in Supabase Storage

### 3. Record Audio
- Use the **Record** tab to record audio directly from your microphone
- Features pause/resume functionality and real-time duration tracking
- Recordings are automatically saved to your account

### 4. Transcription
- Navigate to the **Transcribe** tab after uploading/recording
- Click "Start Transcription" to begin processing
- View confidence scores, word counts, and processing time
- Edit transcriptions if needed

### 5. AI Analysis
- Use the **Analyze** tab to analyze completed transcriptions
- Choose from preset analysis types:
  - **Summary**: Concise overview of main points
  - **Sentiment**: Emotional tone analysis
  - **Keywords**: Key terms extraction
  - **Action Items**: Tasks and decisions identification
  - **Insights**: Deep analysis and takeaways
  - **Custom**: Write your own analysis prompt
- View analysis results with token usage and processing time

### 6. History
- Access the **History** tab to view all your content
- Search and filter by type, date, or content
- Download or delete items as needed

## Project Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components
│   ├── audio/                # Audio upload/recording
│   ├── transcription/        # Transcription viewer
│   ├── analysis/            # AI analysis components
│   ├── history/             # History browser
│   ├── layout/              # Layout components
│   └── ui/                  # Reusable UI components
├── hooks/                   # Custom React hooks
├── lib/                     # Utility libraries
├── store/                   # State management
└── types/                   # TypeScript type definitions

supabase/
├── functions/               # Edge functions
│   ├── transcribe-audio/   # Deepgram integration
│   └── analyze-transcription/ # Gemini AI integration
└── migrations/             # Database schema
```

## Deployment

### Frontend Deployment (Vercel/Netlify)

1. Connect your repository to Vercel or Netlify
2. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

### Edge Functions

Edge functions are automatically deployed to your Supabase project. Make sure to set the required environment variables in your Supabase dashboard.

## Security Features

- **Row Level Security (RLS)**: All database tables protected with RLS policies
- **File Upload Validation**: Client and server-side file type and size validation
- **User Authentication**: Secure email/password authentication
- **API Key Protection**: All API keys stored securely in edge functions
- **Input Sanitization**: XSS prevention for all user inputs

## Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo and useMemo for expensive operations
- **Progress Tracking**: Real-time updates for long-running operations
- **File Size Limits**: 25MB maximum to ensure good performance
- **Database Indexing**: Optimized queries with proper indexes

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**Note**: Audio recording requires modern browser support for MediaRecorder API.

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   - Check browser permissions for microphone access
   - Ensure you're using HTTPS in production

2. **Upload Failures**
   - Verify file size is under 25MB
   - Check file format is supported
   - Ensure you're authenticated

3. **Transcription Errors**
   - Verify Deepgram API key is set correctly
   - Check audio file format compatibility
   - Ensure sufficient API credits

4. **Analysis Failures**
   - Verify Gemini API key configuration
   - Check API quotas and limits
   - Ensure transcription exists

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure all API keys have sufficient credits/quotas
4. Check Supabase logs for edge function errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.