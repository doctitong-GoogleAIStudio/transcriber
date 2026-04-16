import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Get auth token from storage
const getToken = () => {
  const storageType = localStorage.getItem('auth_storage');
  const storage = storageType === 'local' ? localStorage : sessionStorage;
  return storage.getItem('auth_token');
};

// Create axios instance with auth interceptor
const authAxios = axios.create();
authAxios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to convert File to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error('Could not convert file to base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

// Detect language from audio file
export const detectLanguage = async (file) => {
  try {
    const base64Audio = await fileToBase64(file);
    
    const response = await axios.post(`${API}/detect-language`, {
      audio_base64: base64Audio,
      mime_type: file.type,
    });
    
    return response.data.language;
  } catch (error) {
    console.error('Error detecting language:', error);
    throw new Error(
      error.response?.data?.detail || 'Language detection failed. Please try again.'
    );
  }
};

// Transcribe audio file
export const transcribeAudio = async (file, language) => {
  try {
    const base64Audio = await fileToBase64(file);
    
    const response = await axios.post(`${API}/transcribe`, {
      audio_base64: base64Audio,
      mime_type: file.type,
      language: language,
    });
    
    return response.data.transcription;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error(
      error.response?.data?.detail || 'Transcription failed. Please try again.'
    );
  }
};

// Translate text to English
export const translateText = async (text, sourceLanguage) => {
  try {
    const response = await axios.post(`${API}/translate`, {
      text: text,
      source_language: sourceLanguage,
    });
    
    return response.data.translated_text;
  } catch (error) {
    console.error('Error translating text:', error);
    throw new Error(
      error.response?.data?.detail || 'Translation failed. Please try again.'
    );
  }
};

// ============================================================================
// HISTORY API (per-user, stored in MongoDB)
// ============================================================================

export const fetchHistory = async () => {
  try {
    const response = await authAxios.get(`${API}/history/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
};

export const createHistoryItem = async (item) => {
  try {
    const response = await authAxios.post(`${API}/history/`, {
      file_name: item.fileName,
      language: item.language,
      transcription: item.transcription,
      original_transcription: item.originalTranscription || null,
      date: item.date,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating history item:', error);
    throw new Error('Failed to save transcription history.');
  }
};

export const updateHistoryItem = async (itemId, update) => {
  try {
    const payload = {};
    if (update.transcription !== undefined) payload.transcription = update.transcription;
    if (update.originalTranscription !== undefined) payload.original_transcription = update.originalTranscription;
    if (update.date !== undefined) payload.date = update.date;

    const response = await authAxios.put(`${API}/history/${itemId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating history item:', error);
    throw new Error('Failed to update history.');
  }
};

export const deleteHistoryItem = async (itemId) => {
  try {
    await authAxios.delete(`${API}/history/${itemId}`);
  } catch (error) {
    console.error('Error deleting history item:', error);
    throw new Error('Failed to delete history item.');
  }
};

export const clearAllHistory = async () => {
  try {
    await authAxios.delete(`${API}/history/`);
  } catch (error) {
    console.error('Error clearing history:', error);
    throw new Error('Failed to clear history.');
  }
};
