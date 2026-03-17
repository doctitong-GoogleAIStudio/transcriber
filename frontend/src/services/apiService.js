import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
