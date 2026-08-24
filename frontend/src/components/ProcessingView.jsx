import React, { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import ModeSelector from './ModeSelector';
import { detectLanguage, transcribeAudio } from '../services/apiService';
import { Language } from '../types';

const ProcessingView = ({ file, onComplete, onBack }) => {
  const [stage, setStage] = useState('detecting'); // detecting | transcribing | selectMode | done
  const [language, setLanguage] = useState(Language.AUTO_DETECT);
  const [mode, setMode] = useState('general');
  const [error, setError] = useState('');

  const startProcessing = React.useCallback(async () => {
    if (!file) return;
    setError('');

    // Step 1: Detect language
    setStage('detecting');
    try {
      const detected = await detectLanguage(file);
      setLanguage(detected);
    } catch (err) {
      setLanguage('English');
    }

    setStage('selectMode');
  }, [file]);

  React.useEffect(() => {
    startProcessing();
  }, [startProcessing]);

  const handleStartTranscription = async () => {
    setStage('transcribing');
    setError('');
    try {
      const result = await transcribeAudio(file, language);
      onComplete({
        transcription: result,
        language,
        fileName: file.name,
        mode,
      });
    } catch (err) {
      setError(err.message || 'Transcription failed.');
      setStage('selectMode');
    }
  };

  return (
    <div className="px-4 pt-4 pb-safe max-w-md mx-auto flex flex-col min-h-[calc(100vh-5rem)]">
      <button
        onClick={onBack}
        data-testid="processing-back-btn"
        className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-6 -ml-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Cancel</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-6 w-full" data-testid="processing-error">
            {error}
          </div>
        )}

        {stage === 'detecting' && (
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Detecting Language</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Analyzing audio...</p>
          </div>
        )}

        {stage === 'selectMode' && (
          <div className="w-full">
            <div className="text-center mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Ready to Transcribe</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Detected: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{language}</span>
              </p>
            </div>

            {/* Language override */}
            <div className="mb-6">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2 block">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                data-testid="language-select"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {Object.values(Language).filter(l => l !== Language.AUTO_DETECT).map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Mode selection */}
            <div className="mb-8">
              <label className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2 block">Transcription Mode</label>
              <ModeSelector selected={mode} onChange={setMode} />
            </div>

            <button
              onClick={handleStartTranscription}
              data-testid="start-transcribe-btn"
              className="w-full py-4 bg-emerald-800 dark:bg-emerald-600 text-white rounded-2xl text-base font-bold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors active:scale-[0.98]"
            >
              Transcribe Audio
            </button>
          </div>
        )}

        {stage === 'transcribing' && (
          <div className="text-center">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Transcribing</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingView;
