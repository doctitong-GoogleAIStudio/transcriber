import React from 'react';
import { CloseIcon } from './Icons';

export const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 text-gray-800 dark:text-gray-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          aria-label="Close modal"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 mb-4">
          About Digos Doctors Hospital AI Audio Transcriber
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          An AI-powered audio to text transcription application that supports 23 languages including major Filipino languages, English, and various Asian, European, and Middle Eastern languages. Record live audio or upload files to get accurate transcriptions in seconds.
        </p>
        
        <div className="space-y-3 mb-4">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-base">Features:</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-4">
            <li>🎤 <strong>Audio Input:</strong> Record live audio or upload audio files (MP3, WAV, M4A, WebM)</li>
            <li>🌍 <strong>Multi-Language:</strong> Auto-detect and transcribe in 23+ languages including Tagalog, Cebuano, Ilocano, Bikol, Waray, and more</li>
            <li>🤖 <strong>AI Transcription:</strong> Powered by Google Gemini 2.5 Flash for high accuracy</li>
            <li>🔄 <strong>Translation:</strong> Automatic English translation from any supported language</li>
            <li>📋 <strong>AI SOAP Notes:</strong> Auto-generate clinical SOAP summaries (Subjective, Objective, Assessment, Plan)</li>
            <li>📄 <strong>Multiple Formats:</strong> Export as plain text, TXT, or professional PDF documents</li>
            <li>💾 <strong>History:</strong> Save, edit, and manage transcription history locally</li>
            <li>🔠 <strong>Upper Case:</strong> Toggle transcription text to all uppercase for easy reading and documentation</li>
            <li>📱 <strong>PWA Support:</strong> Install as app, works offline, mobile-optimized</li>
            <li>🌓 <strong>Dark Mode:</strong> Switch between light and dark themes</li>
          </ul>
          
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-base mt-4">How to Use:</h3>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-4 list-decimal">
            <li>Upload an audio file or record live from your microphone</li>
            <li>System auto-detects the spoken language</li>
            <li>Click "Transcribe Audio" to generate transcription</li>
            <li>Optionally translate to English</li>
            <li>Click "Share" to generate SOAP summary, copy text, or download as PDF/TXT</li>
            <li>View and manage transcription history below</li>
          </ol>
          
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-base mt-4">Supported Languages:</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 ml-4">
            Arabic, Bikol, Cebuano, English, French, German, Hindi, Ilocano, Ilonggo (Hiligaynon), Indonesian, Italian, Japanese, Korean, Mandarin Chinese, Portuguese, Russian, Spanish, Tagalog, Thai, Vietnamese, Waray, and more.
          </p>
        </div>
        
        <div className="text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Developed by Vicente C. Cavalida, Jr. MD</p>
          <p className="mb-1"><strong>Version:</strong> 1.2.2 (Build 20260325.1)</p>
          <p className="mb-1"><strong>AI Model:</strong> Google Gemini 2.5 Flash</p>
          <p className="mb-2"><strong>Core Features:</strong> Transcription • Translation • AI SOAP Generation • Upper Case Toggle • Export to PDF/TXT</p>
          <p>&copy; {new Date().getFullYear()} Digos Doctors Hospital AI Audio Transcriber. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
