// Mock data for testing the UI before backend integration

export const mockTranscription = {
  english: "Hello, this is a test transcription of an audio file. The AI is processing your audio and converting it into text format. This transcription feature supports multiple languages and can accurately transcribe speech with high accuracy.",
  tagalog: "Kumusta, ito ay isang pagsubok na transkripsyon ng isang audio file. Ang AI ay nagpoproseso ng iyong audio at nagko-convert nito sa text format. Ang feature na ito ay sumusuporta sa maraming wika at maaaring tumpak na mag-transcribe ng pagsasalita.",
  spanish: "Hola, esta es una transcripción de prueba de un archivo de audio. La IA está procesando tu audio y convirtiéndolo en formato de texto. Esta función de transcripción admite varios idiomas y puede transcribir el habla con gran precisión.",
};

export const mockDetectedLanguage = (fileName) => {
  if (fileName.toLowerCase().includes('english') || fileName.toLowerCase().includes('en')) {
    return 'English';
  } else if (fileName.toLowerCase().includes('tagalog') || fileName.toLowerCase().includes('tl')) {
    return 'Tagalog';
  } else if (fileName.toLowerCase().includes('spanish') || fileName.toLowerCase().includes('es')) {
    return 'Spanish';
  }
  return 'English'; // Default
};

export const mockTranslation = {
  toEnglish: "This is a mock English translation of the transcribed text. In a real scenario, this would be the actual translation from the source language to English using AI translation services.",
};

// Simulate API delay
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
