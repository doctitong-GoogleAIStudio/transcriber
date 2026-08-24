import React, { useState, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, Copy, Download, Share2, Check, Loader2, Search, X, Users, MessageCircleQuestion, Send } from 'lucide-react';
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

// Highlight matching text in a string
const HighlightedText = ({ text, searchTerm }) => {
  if (!searchTerm || !text) return <>{text}</>;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-300 dark:bg-amber-600 text-slate-900 dark:text-white rounded px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

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

  // Speaker Labels
  const [speakerText, setSpeakerText] = useState('');
  const [isSpeakerLoading, setIsSpeakerLoading] = useState(false);
  const [speakerRenames, setSpeakerRenames] = useState({});
  const [showSpeakers, setShowSpeakers] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef(null);

  // Ask Recording
  const [askQuestion, setAskQuestion] = useState('');
  const [askHistory, setAskHistory] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const askInputRef = useRef(null);

  const displayText = isUpperCase ? (transcription || '').toUpperCase() : transcription;

  // Search match count
  const searchMatchCount = useMemo(() => {
    if (!searchQuery || !displayText) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (displayText.match(regex) || []).length;
  }, [searchQuery, displayText]);

  // Apply speaker renames to text
  const displaySpeakerText = useMemo(() => {
    if (!speakerText) return '';
    let result = speakerText;
    Object.entries(speakerRenames).forEach(([original, renamed]) => {
      if (renamed.trim()) {
        result = result.replace(new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), renamed);
      }
    });
    return isUpperCase ? result.toUpperCase() : result;
  }, [speakerText, speakerRenames, isUpperCase]);

  // Extract unique speaker labels from text
  const detectedSpeakers = useMemo(() => {
    if (!speakerText) return [];
    const regex = /^(Speaker \d+(?:\s*\([^)]+\))?):?/gm;
    const speakers = new Set();
    let match;
    while ((match = regex.exec(speakerText)) !== null) {
      speakers.add(match[1]);
    }
    return [...speakers];
  }, [speakerText]);

  const handleGenerateSummary = useCallback(async () => {
    if (!transcription || isSummaryLoading) return;
    setIsSummaryLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/generate-summary`, { transcription, language });
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
      const res = await axios.post(`${API}/generate-insights`, { transcription, language, mode: selectedMode || mode });
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
      const res = await axios.post(`${API}/translate`, { text: transcription, source_language: language });
      setTranslation(res.data.translated_text);
    } catch (err) {
      setError(err.response?.data?.detail || 'Translation failed.');
    } finally {
      setIsTranslating(false);
    }
  }, [transcription, language, isTranslating]);

  const handleIdentifySpeakers = useCallback(async () => {
    if (!transcription || isSpeakerLoading) return;
    setIsSpeakerLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/identify-speakers`, { transcription, language });
      setSpeakerText(res.data.labeled_transcription);
      setShowSpeakers(true);
      setSpeakerRenames({});
    } catch (err) {
      setError(err.response?.data?.detail || 'Speaker identification failed.');
    } finally {
      setIsSpeakerLoading(false);
    }
  }, [transcription, language, isSpeakerLoading]);

  const handleAskRecording = useCallback(async () => {
    if (!askQuestion.trim() || !transcription || isAsking) return;
    const q = askQuestion.trim();
    setAskQuestion('');
    setAskHistory((prev) => [...prev, { type: 'question', text: q }]);
    setIsAsking(true);
    try {
      const res = await axios.post(`${API}/ask-recording`, { transcription, language, question: q });
      setAskHistory((prev) => [...prev, { type: 'answer', text: res.data.answer }]);
    } catch (err) {
      setAskHistory((prev) => [...prev, { type: 'answer', text: 'Failed to get answer. Please try again.' }]);
    } finally {
      setIsAsking(false);
    }
  }, [askQuestion, transcription, language, isAsking]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (activeTab === 'insights') handleGenerateInsights(newMode);
  };

  const handleCopy = () => {
    let text;
    if (showSpeakers && speakerText) text = displaySpeakerText;
    else if (activeTab === 'translation' && translation) text = translation;
    else text = displayText;
    if (text) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    let text;
    if (showSpeakers && speakerText) text = displaySpeakerText;
    else if (activeTab === 'translation' && translation) text = translation;
    else text = displayText;
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

  const handleRenameSpeaker = (original, newName) => {
    setSpeakerRenames((prev) => ({ ...prev, [original]: newName }));
  };

  const renderSectionLabel = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="px-4 pt-4 pb-safe max-w-md mx-auto flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} data-testid="transcription-back-btn" className="flex items-center gap-1 text-slate-500 dark:text-slate-400 -ml-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setIsUpperCase(!isUpperCase)} data-testid="uppercase-toggle-btn" className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${isUpperCase ? 'bg-emerald-800 dark:bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>AA</button>
          <button onClick={() => { setShowSearch(!showSearch); if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 100); }} data-testid="search-toggle-btn" className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'bg-emerald-800 dark:bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            <Search className="h-4 w-4" />
          </button>
          <button onClick={handleCopy} data-testid="copy-btn" className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </button>
          <button onClick={handleDownload} data-testid="download-btn" className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
            <Download className="h-4 w-4" />
          </button>
          <button onClick={onOpenShare} data-testid="share-btn" className="p-1.5 rounded-lg bg-emerald-800 dark:bg-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="flex items-center gap-2 mb-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2" data-testid="search-bar">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            data-testid="search-input"
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <span className="text-xs text-slate-400 flex-shrink-0">{searchMatchCount} found</span>
          )}
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* File info + action buttons */}
      <div className="flex items-center justify-between mb-3">
        {fileName && <p className="text-xs text-slate-400 dark:text-slate-500 truncate flex-1">{fileName}</p>}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            onClick={handleIdentifySpeakers}
            disabled={isSpeakerLoading}
            data-testid="identify-speakers-btn"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              showSpeakers ? 'bg-emerald-800 dark:bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {isSpeakerLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            <span>Speakers</span>
          </button>
          <button
            onClick={() => setShowAsk(!showAsk)}
            data-testid="ask-recording-btn"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              showAsk ? 'bg-emerald-800 dark:bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <MessageCircleQuestion className="h-3.5 w-3.5" />
            <span>Ask</span>
          </button>
        </div>
      </div>

      {/* Speaker Rename Panel */}
      {showSpeakers && detectedSpeakers.length > 0 && (
        <div className="mb-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3" data-testid="speaker-rename-panel">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400 font-semibold">Rename Speakers</h4>
            <button onClick={() => setShowSpeakers(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {detectedSpeakers.map((speaker) => (
              <div key={speaker} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[90px] truncate">{speaker}</span>
                <input
                  type="text"
                  placeholder={speaker}
                  value={speakerRenames[speaker] || ''}
                  onChange={(e) => handleRenameSpeaker(speaker, e.target.value)}
                  data-testid={`rename-${speaker.replace(/\s/g, '-')}`}
                  className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ask the Recording Panel */}
      {showAsk && (
        <div className="mb-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden" data-testid="ask-recording-panel">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <h4 className="text-xs uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400 font-semibold">Ask the Recording</h4>
            <button onClick={() => setShowAsk(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
          {askHistory.length > 0 && (
            <div className="max-h-40 overflow-y-auto px-3 py-2 space-y-2" data-testid="ask-history">
              {askHistory.map((item, i) => (
                <div key={i} className={`text-sm ${item.type === 'question' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block px-3 py-1.5 rounded-xl max-w-[85%] ${
                    item.type === 'question'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {item.text}
                  </span>
                </div>
              ))}
              {isAsking && (
                <div className="text-left">
                  <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 p-2 border-t border-slate-100 dark:border-slate-700">
            <input
              ref={askInputRef}
              type="text"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskRecording()}
              placeholder="Ask a question about this recording..."
              data-testid="ask-input"
              className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={handleAskRecording}
              disabled={!askQuestion.trim() || isAsking}
              data-testid="ask-send-btn"
              className="p-2 rounded-full bg-emerald-800 dark:bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mode Selector */}
      <div className="mb-3">
        <ModeSelector selected={mode} onChange={handleModeChange} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-3" data-testid="result-tabs">
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
            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors relative ${
              activeTab === tab.id ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-800 dark:bg-emerald-400 rounded-full" />}
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
            {showSpeakers && speakerText ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 min-h-[300px]">
                <p className="text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'Figtree', sans-serif" }}>
                  <HighlightedText text={displaySpeakerText} searchTerm={searchQuery} />
                </p>
              </div>
            ) : searchQuery ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 min-h-[300px]">
                <p className="text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'Figtree', sans-serif" }}>
                  <HighlightedText text={displayText} searchTerm={searchQuery} />
                </p>
              </div>
            ) : (
              <textarea
                value={displayText}
                onChange={(e) => onTextChange(e.target.value)}
                data-testid="transcription-textarea"
                className="w-full min-h-[300px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-slate-200 text-base resize-y focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-[Figtree]"
                placeholder="Transcription will appear here..."
              />
            )}
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
                <button onClick={handleGenerateSummary} data-testid="generate-summary-btn" className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors">
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
              <div className="space-y-3">
                {mode === 'medical' && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300">
                    AI-assisted output. The clinician MUST verify all information.
                  </div>
                )}
                {Object.entries(insights).map(([key, value]) => (
                  <div key={key} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <h4 className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 font-semibold mb-2">{renderSectionLabel(key)}</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-slate-400 mb-3">Select a mode and generate insights</p>
                <button onClick={() => handleGenerateInsights(mode)} data-testid="generate-insights-btn" className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors">
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
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                  <h4 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-2">Original ({language})</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{originalTranscription || transcription}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-slate-400 mb-3">Translate from {language} to English</p>
                <button onClick={handleTranslate} data-testid="translate-btn" className="px-5 py-2.5 bg-emerald-800 dark:bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors">
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
