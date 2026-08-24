import React, { useRef } from 'react';
import { Mic, Upload, FileText, ChevronRight } from 'lucide-react';

const HomePage = ({ onNavigate, onFileSelect, historyCount }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert('File is too large. Please upload an audio file under 500MB.');
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <div className="px-4 pt-6 pb-safe max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100" data-testid="home-title">
          DDH Transcriber
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          AI-powered audio transcription & analysis
        </p>
      </div>

      {/* Primary Actions */}
      <div className="space-y-3 mb-8">
        <button
          onClick={() => onNavigate('record')}
          data-testid="home-record-btn"
          className="w-full flex items-center gap-4 p-5 bg-emerald-800 dark:bg-emerald-700 rounded-2xl text-white transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Mic className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="text-left">
            <span className="text-lg font-bold block">Record Audio</span>
            <span className="text-emerald-200 text-sm">Start a live recording</span>
          </div>
          <ChevronRight className="h-5 w-5 ml-auto opacity-60" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          data-testid="home-upload-btn"
          className="w-full flex items-center gap-4 p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 transition-colors hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
            <Upload className="h-6 w-6 text-slate-600 dark:text-slate-300" strokeWidth={2} />
          </div>
          <div className="text-left">
            <span className="text-lg font-bold block">Upload Audio</span>
            <span className="text-slate-500 dark:text-slate-400 text-sm">MP3, WAV, M4A, WebM</span>
          </div>
          <ChevronRight className="h-5 w-5 ml-auto text-slate-400" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept="audio/*"
          onChange={handleFileChange}
          data-testid="home-file-input"
        />
      </div>

      {/* My Transcripts shortcut */}
      <button
        onClick={() => onNavigate('transcripts')}
        data-testid="home-transcripts-btn"
        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-400" strokeWidth={2} />
        </div>
        <div className="text-left flex-1">
          <span className="text-base font-semibold text-slate-900 dark:text-slate-100 block">My Transcripts</span>
          <span className="text-slate-500 dark:text-slate-400 text-sm">
            {historyCount > 0 ? `${historyCount} saved transcript${historyCount !== 1 ? 's' : ''}` : 'No transcripts yet'}
          </span>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </button>
    </div>
  );
};

export default HomePage;
