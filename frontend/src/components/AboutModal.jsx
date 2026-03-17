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
        className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 text-gray-800 dark:text-gray-300 relative"
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
          An AI-powered audio to text transcription application that supports a vast range of languages, including English, major Filipino languages, and various Asian, European, and Middle Eastern languages. Record live audio or upload a file, select the language, and get an accurate transcription in seconds.
        </p>
        <div className="text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Developed by Vicente C. Cavalida, Jr. MD</p>
          <p>Version 1.2.0 (Build 20260223.1)</p>
          <p>Powered by Google Gemini.</p>
          <p>&copy; {new Date().getFullYear()} Digos Doctors Hospital AI Audio Transcriber. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
