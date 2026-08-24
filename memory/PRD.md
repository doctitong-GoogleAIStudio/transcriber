# Product Requirements Document — DDH AI Audio Transcriber

## Original Problem Statement
Create an app based on the uploaded DIDH-AI-Audio-Transcriber-main.zip file. Change the name to "Digos Doctors Hospital AI Audio Transcriber". Integrate AI for transcription, translation, and auto-generating SOAP summaries. Convert to a Progressive Web App (PWA). Add a share feature for PDF/TXT downloads. Add username/password authentication. Redesign as mobile-first app with new home screen and post-processing tabs.

## Architecture
- Frontend: React.js + Tailwind CSS (mobile-first PWA)
- Backend: FastAPI + MongoDB
- AI: Google Gemini 2.5 Flash via emergentintegrations
- Auth: JWT-based with bcrypt password hashing
- Design: Emerald/green theme, Manrope headings, Figtree body

## Features Implemented

### 1. User Authentication (JWT-based)
- Self-registration with username, password, optional full name
- Login with "Remember Me" (30-day token in localStorage vs 24-hour sessionStorage)
- Forgot Password with 6-digit reset code
- Protected routes — all app features gated behind auth

### 2. Mobile-First UI (v1.3.0)
- **Home Screen**: Record Audio, Upload Audio, My Transcripts
- **Bottom Navigation**: Home, Record (center), Transcripts, Settings
- **Recording View**: Timer, mic button, pulse animation
- **Processing View**: Language detection, mode selection, transcribe button
- **TranscriptionView**: 4 tabs — Transcript, Summary, AI Insights, Translation
- **Transcripts List**: Searchable history with delete per item
- **Settings**: User profile, Dark Mode toggle, About, Sign Out

### 3. Mode Selector
- 5 modes: General, Meeting, Medical, Lecture, Interview
- Selectable before and after transcription
- Each mode generates different AI insights

### 4. AI-Powered Features
- **Transcription**: Audio → text via Gemini 2.5 Flash
- **Language Detection**: Auto-detect from 23+ languages
- **Translation**: Any language → English
- **AI Summary**: Concise 3-5 paragraph summary
- **AI Insights**: Mode-specific analysis
  - General: Overview, Key Points, Notable Quotes, Follow-up
  - Meeting: Discussion, Decisions, Action Items, Responsible, Deadlines
  - Medical: SOAP notes with consent disclaimer
  - Lecture: Key Points, Definitions, Notes, Review Questions
  - Interview: Participants, Dialogue, Key Takeaways

### 5. Export & Share
- PDF export (via jspdf)
- TXT download
- Copy to clipboard
- Upper case toggle

### 6. PWA
- Service worker, manifest.json
- Installable on mobile
- Offline-capable recording (future)

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/change-password

### Transcription
- POST /api/detect-language
- POST /api/transcribe
- POST /api/translate
- POST /api/generate-summary
- POST /api/generate-insights
- POST /api/generate-soap

### History (protected, per-user)
- GET /api/history/
- POST /api/history/
- PUT /api/history/{id}
- DELETE /api/history/{id}
- DELETE /api/history/

## Version
- Version 1.3.0
- Developed by Vicente C. Cavalida, Jr. MD
- Powered by Google Gemini 2.5 Flash

## Upcoming Features (Phase 2-4)
- Speaker Identification (label Speaker 1, 2 etc)
- Ask the Recording (AI Q&A about transcript)
- Search Transcript (search + jump to timestamp)
- Live Recording + Live Transcription
- DOCX export
- Audio + Transcript Archive (searchable by title, date, category, speaker)
- Privacy Controls (deletion, retention, consent indicators)
- Offline Recording (process when connectivity returns)
