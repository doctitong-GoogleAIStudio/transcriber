# Product Requirements Document: AI Audio Transcriber

## Overview
An AI-powered audio to text transcription application with multi-language support, live recording, and translation capabilities.

## Features Implemented

### 1. User Authentication (JWT-based)
- **Registration**: Self-register with username, password, and optional full name
- **Login**: Sign in with username & password, with "Remember Me" option
- **Forgot Password**: Generate a 6-digit reset code, enter code to set new password
- **Session Persistence**: Remember me stores token in localStorage (30-day expiry), otherwise sessionStorage (24-hour expiry)
- **Protected Routes**: All app features gated behind authentication
- **Per-user Data**: Each user has their own private transcription history stored in MongoDB

### 2. Audio Input
- **File Upload**: Support for multiple audio formats (MP3, WAV, M4A, WebM, etc.)
- **Live Recording**: Real-time microphone recording with timer display
- **File Size Limit**: Maximum 500MB per file

### 2. Language Support
- **Auto-Detection**: Automatic language detection from audio files
- **23 Languages**: Including Filipino languages (Tagalog, Cebuano, Ilocano, Ilonggo, Bikol, Waray), English, and major international languages
- **Language Selection**: Dropdown menu for manual language selection

### 3. Transcription
- **AI-Powered**: Using Google Gemini 2.5 Flash model
- **Real-time Processing**: Transcription with loading indicators
- **Editable Results**: Users can edit transcription text
- **Multi-language**: Accurate transcription in selected language

### 4. Translation
- **English Translation**: Translate any transcription to English
- **Toggle View**: Switch between original and translated text
- **Preserve Original**: Keep both original and translated versions

### 5. History Management
- **Local Storage**: Persistent history saved in browser
- **View History**: Click to load previous transcriptions
- **Edit & Save**: Modify and save changes to history items
- **Delete Items**: Remove individual history entries
- **Clear All**: Clear entire history with confirmation

### 6. User Interface
- **Theme Toggle**: Light/dark mode with animated transition
- **Animated Background**: Gradient animation with glass morphism effects
- **Responsive Design**: Works on desktop and mobile devices
- **About Modal**: Information about the app and developer
- **Action Buttons**: Copy, Download, Save edits functionality
- **Upper Case Toggle**: Convert transcription text display to all uppercase letters (affects display, copy, and download)

### 7. Backend Integration
- **FastAPI**: RESTful API endpoints
- **Google Gemini API**: Audio transcription and translation via emergentintegrations
- **Error Handling**: Comprehensive error messages
- **CORS Support**: Cross-origin requests enabled

## Technical Stack

### Frontend
- React 19.0.0
- Tailwind CSS
- Axios for API calls
- LocalStorage for persistence

### Backend
- FastAPI
- MongoDB (for future features)
- emergentintegrations library
- Google Gemini 2.5 Flash model
- Emergent LLM Key for authentication

## API Endpoints

### Auth
1. `POST /api/auth/register` - Register new user (username, password, full_name)
2. `POST /api/auth/login` - Login (username, password, remember_me)
3. `GET /api/auth/me` - Get current user (requires Bearer token)
4. `POST /api/auth/forgot-password` - Generate reset code
5. `POST /api/auth/reset-password` - Reset password with code
6. `POST /api/auth/change-password` - Change password (requires auth)

### Transcription
7. `POST /api/detect-language` - Auto-detect language from audio
8. `POST /api/transcribe` - Transcribe audio to text
9. `POST /api/translate` - Translate text to English
10. `POST /api/generate-soap` - Generate SOAP clinical notes

### History (protected, per-user)
11. `GET /api/history/` - Get user's transcription history
12. `POST /api/history/` - Save new transcription to history
13. `PUT /api/history/{id}` - Update a history item
14. `DELETE /api/history/{id}` - Delete a history item
15. `DELETE /api/history/` - Clear all history

## User Flow

1. User uploads audio file or records live
2. System auto-detects language
3. User confirms or changes language
4. User clicks "Transcribe Audio"
5. System processes and displays transcription
6. User can edit, copy, download, or translate
7. Transcription saved to history automatically
8. User can access history anytime

## Design Features

- Purple-to-indigo gradient text for headers
- Animated gradient background (light/dark themes)
- Glass morphism card effects with backdrop blur
- Smooth transitions and hover effects
- Loading spinners for async operations
- Error messages with red styling
- Success indicators for copy/save actions

## Version
- Version 1.2.2 (Build 20260325.1)
- Developed by Vicente C. Cavalida, Jr. MD
- Powered by Google Gemini
