import React from 'react';
import { X } from 'lucide-react';

export const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-800 dark:text-slate-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-extrabold text-emerald-800 dark:text-emerald-400 mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
          DDH AI Audio Transcriber
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          AI-powered audio transcription with multi-language support, clinical SOAP notes, meeting minutes, lecture notes, and more.
        </p>
        
        <div className="space-y-3 mb-4">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Features:</h3>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 ml-3">
            <li>Record live audio or upload files (MP3, WAV, M4A, WebM)</li>
            <li>Auto-detect and transcribe in 23+ languages including Tagalog, Cebuano, Ilocano</li>
            <li>AI-powered transcription via Google Gemini 2.5 Flash</li>
            <li>Automatic English translation from any language</li>
            <li>AI Summary generation from transcriptions</li>
            <li>5 analysis modes: General, Meeting Minutes, Medical SOAP, Lecture Notes, Interview</li>
            <li>Upper case toggle for easy reading</li>
            <li>Export as TXT or PDF</li>
            <li>Per-user private transcription history</li>
            <li>Installable PWA — works on mobile</li>
            <li>Dark mode support</li>
          </ul>
          
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mt-3">Supported Languages:</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 ml-3">
            Arabic, Bikol, Cebuano, English, French, German, Hindi, Ilocano, Ilonggo, Indonesian, Italian, Japanese, Korean, Mandarin Chinese, Portuguese, Russian, Spanish, Tagalog, Thai, Vietnamese, Waray, and more.
          </p>
        </div>
        
        <div className="text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
          <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Developed by Vicente C. Cavalida, Jr. MD</p>
          <p className="mb-0.5"><strong>Version:</strong> 1.3.0</p>
          <p className="mb-0.5"><strong>AI Model:</strong> Google Gemini 2.5 Flash</p>
          <p>&copy; {new Date().getFullYear()} Digos Doctors Hospital. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
