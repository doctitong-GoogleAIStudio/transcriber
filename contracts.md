# API Contracts and Integration Plan

## Backend API Endpoints

### 1. POST /api/transcribe
**Purpose:** Transcribe audio file to text in the specified language

**Request:**
```json
{
  "audio_base64": "string (base64 encoded audio file)",
  "mime_type": "string (audio/webm, audio/mp3, audio/wav, etc.)",
  "language": "string (English, Tagalog, Spanish, etc.)"
}
```

**Response:**
```json
{
  "transcription": "string (transcribed text)",
  "detected_language": "string (detected language if auto-detect was used)"
}
```

### 2. POST /api/detect-language
**Purpose:** Detect the language spoken in the audio file

**Request:**
```json
{
  "audio_base64": "string (base64 encoded audio file)",
  "mime_type": "string"
}
```

**Response:**
```json
{
  "language": "string (detected language name)"
}
```

### 3. POST /api/translate
**Purpose:** Translate text from source language to English

**Request:**
```json
{
  "text": "string (text to translate)",
  "source_language": "string (source language)"
}
```

**Response:**
```json
{
  "translated_text": "string (translated text in English)"
}
```

## Mock Data Replacement Plan

### Frontend mock data locations:
- `/app/frontend/src/utils/mockData.js`:
  - `mockTranscription` - Replace with actual API call to `/api/transcribe`
  - `mockDetectedLanguage` - Replace with actual API call to `/api/detect-language`
  - `mockTranslation` - Replace with actual API call to `/api/translate`

### Frontend integration changes:
- Replace `delay()` calls with actual `axios` requests
- Update `handleTranscribe()` to send audio file to backend
- Update `autoDetectLanguage()` to call detection endpoint
- Update `handleTranslate()` to call translation endpoint

## Backend Implementation Details

### Technology Stack:
- FastAPI for REST API
- Google Gemini 2.5 Flash via emergentintegrations library
- Emergent LLM Key for authentication

### Key Components:

1. **Audio File Handling:**
   - Accept base64 encoded audio files
   - Support multiple audio formats (webm, mp3, wav, m4a)
   - File size limit: 500MB

2. **Gemini Integration:**
   - Use emergentintegrations library
   - Model: gemini-2.5-flash
   - Support multimodal content (audio + text prompts)

3. **Language Support:**
   - 23 languages including Filipino languages
   - Auto-detection capability
   - Translation to English

### Error Handling:
- Invalid audio format
- File size exceeded
- API rate limits
- Network errors
- Invalid language selection

## Environment Variables
- `EMERGENT_LLM_KEY`: Universal key for Gemini API access (already configured)

## Testing Plan
1. Test audio upload and transcription
2. Test live recording and transcription
3. Test language auto-detection
4. Test translation feature
5. Test history persistence in localStorage
6. Test edit and save functionality
7. Test copy and download features
