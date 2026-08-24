import React, { useState, useCallback } from 'react';
import { ChevronLeft, Copy, Download, Share2, Check, Loader2 } from 'lucide-react';
import ModeSelector from './ModeSelector';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TABS = [
  { id: 'transcript', label: 'Transcript' },
  { id: 'summary', label: 'Summary' },
  { id: 'insights', label: 'AI Insights' },
  { id: 'translation', label: 'Translation' },
];

const TranscriptionView = ({
  transcription,
  originalTranscription,
  language,
  fileName,
  onBack,
  onTextChange,
  onOpenShare,
}) => {
  const [activeTab, setActiveTab] = useState('transcript');
  const [mode, setMode] = useState('general');
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [insightsMode, setInsightsMode] = useState('');
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpperCase, setIsUpperCase] = useState(false);
  const [error, setError] = useState('');

  const displayText = isUpperCase ? (transcription || '').toUpperCase() : transcription;

  const handleGenerateSummary = useCallback(async () => {
    if (!transcription || isSummaryLoading) return;
    setIsSummaryLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/generate-summary`, {
        transcription,
        language,
      });
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.detail || 'Summary generation failed.');
    } finally {
      setIsSummaryLoading(false);
    }
  }, [transcription, language, isSummaryLoading]);

  const handleGenerateInsights = useCallback(async (selectedMode) => {
    if (!transcription || isInsightsLoading) return;
    setIsInsightsLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/generate-insights`, {
        transcription,
        language,
        mode: selectedMode || mode,
      });
      setInsights(res.data.sections);
      setInsightsMode(res.data.mode);
    } catch (err) {
      setError(err.response?.data?.detail || 'Insights generation failed.');
    } finally {
      setIsInsightsLoading(false);
    }
  }, [transcription, language, mode, isInsightsLoading]);

  const handleTranslate = useCallback(async () => {
    if (!transcription || isTranslating || language === 'English') return;
    setIsTranslating(true);
    setError('');
    try {
      const res = await axios.post(`${API}/translate`, {
        text: transcription,
        source_language: language,
      });
      setTranslation(res.data.translated_text);
    } catch (err) {
      setError(err.response?.data?.detail || 'Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  }, [transcription, language, isTranslating]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (activeTab === 'insights') {
      handleGenerateInsights(newMode);
    }
  };

  const handleCopy = () => {
    const text = activeTab === 'translation' && translation ? translation : displayText;
    if (text) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const text = activeTab === 'translation' && translation ? translation : displayText;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (fileName || 'transcription').replace(/\.[^/.]+$/, '') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSectionLabel = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="px-4 pt-4 pb-safe max-w-md mx-auto flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          data-testid="transcription-back-btn"
          className="flex items-center gap-1 text-slate-500 dark:text-slate-400 -ml-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUpperCase(!isUpperCase)}
            data-testid="uppercase-toggle-btn"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isUpperCase
                ? 'bg-emerald-800 dark:bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            AA
          </button>
          <button onClick={handleCopy} data-testid="copy-btn" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
          <button onClick={handleDownload} data-testid="download-btn" className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={onOpenShare} data-testid="share-btn" className="p-2 rounded-lg bg-emerald-800 dark:bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* File info */}
      {fileName && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 truncate">{fileName}</p>
      )}

      {/* Mode Selector */}
      <div className="mb-4">
        <ModeSelector selected={mode} onChange={handleModeChange} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4" data-testid="result-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setError('');
              if (tab.id === 'summary' && !summary && !isSummaryLoading) handleGenerateSummary();
              if (tab.id === 'insights' && (!insights || insightsMode !== mode) && !isInsightsLoading) handleGenerateInsights(mode);
              if (tab.id === 'translation' && !translation && !isTranslating && language !== 'English') handleTranslate();
            }}
            data-testid={`tab-${tab.id}`}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
              activeTab === tab.id
                ? 'text-emerald-800 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-800 dark:bg-emerald-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-xl text-sm mb-3" data-testid="tab-error">
          {error}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'transcript' && (
          <div data-testid="transcript-content">
            <textarea
              value={displayText}
              onChange={(e) => onTextChange(isUpperCase ? e.target.value : e.target.value)}
              data-testid="transcription-textarea"
              className="w-full min-h-[300px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-slate-200 text-base resize-y focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-[Figtree]"
              placeholder="Transcription will appear here..."
            />
          </div>
        )}

        {activeTab === 'summary' && (
          <div data-testid="summary-content">
            {isSummaryLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Generating summary...</p>
              </div>
            ) : summary ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{summary}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-slate-400 mb-3">No summary generated yet</p>
                <button
                  onClick={handleGenerateSummary}
                  data-testid="generate-summary-btn"
                  className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors"
                >
                  Generate Summary
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div data-testid="insights-content">
            {isInsightsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Analyzing with {mode} mode...</p>
              </div>
            ) : insights && Object.keys(insights).length > 0 ? (
              <div className="space-y-4">
                {mode === 'medical' && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                    This is AI-assisted output. The clinician MUST verify all information before use.
                  </div>
                )}
                {Object.entries(insights).map(([key, value]) => (
                  <div key={key} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <h4 className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 font-semibold mb-2">
                      {renderSectionLabel(key)}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-slate-400 mb-3">Select a mode and generate insights</p>
                <button
                  onClick={() => handleGenerateInsights(mode)}
                  data-testid="generate-insights-btn"
                  className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors"
                >
                  Generate {mode.charAt(0).toUpperCase() + mode.slice(1)} Insights
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'translation' && (
          <div data-testid="translation-content">
            {language === 'English' ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-slate-400">Original is already in English.</p>
              </div>
            ) : isTranslating ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Translating to English...</p>
              </div>
            ) : translation ? (
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <h4 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">English Translation</h4>
                  <p className="text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{translation}</p>
                </div>
                {originalTranscription && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <h4 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">Original ({language})</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{originalTranscription || transcription}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-slate-400 mb-3">Translate from {language} to English</p>
                <button
                  onClick={handleTranslate}
                  data-testid="translate-btn"
                  className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors"
                >
                  Translate to English
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionView;
