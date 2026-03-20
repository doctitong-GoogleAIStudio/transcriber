import React, { useState, useCallback, useRef, useEffect } from 'react';
import './App.css';
import { Language } from './types';
import { useTheme } from './hooks/useTheme';
import { AboutModal } from './components/AboutModal';
import {
  UploadIcon,
  AudioFileIcon,
  LoadingSpinner,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  SaveIcon,
  SunIcon,
  MoonIcon,
  InfoIcon,
  MicIcon,
  StopCircleIcon,
  ShareIcon,
  SettingsIcon,
} from './components/Icons';
import { detectLanguage, transcribeAudio, translateText } from './services/apiService';
import { ShareModal } from './components/ShareModal';
import { SharingSettings } from './components/SharingSettings';

const App = () => {
  const [theme, toggleTheme] = useTheme();
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState(Language.AUTO_DETECT);
  const [transcription, setTranscription] = useState('');
  const [originalTranscription, setOriginalTranscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null);
  const [isDisplayingOriginal, setIsDisplayingOriginal] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('transcriptionHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Failed to parse transcription history from localStorage', e);
      localStorage.removeItem('transcriptionHistory');
    }

    // PWA Install prompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const autoDetectLanguage = async () => {
      setIsDetecting(true);
      setError(null);
      setViewingHistoryItem(null);
      try {
        const detected = await detectLanguage(selectedFile);
        setLanguage(detected);
      } catch (err) {
        setError(err.message || 'An unknown error occurred during language detection.');
        setLanguage(Language.ENGLISH);
      } finally {
        setIsDetecting(false);
      }
    };

    autoDetectLanguage();
  }, [selectedFile]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        setError('File is too large. Please upload an audio file under 500MB.');
        return;
      }
      setSelectedFile(file);
      setLanguage(Language.AUTO_DETECT);
      setError(null);
      setTranscription('');
      setOriginalTranscription(null);
      setViewingHistoryItem(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setLanguage(Language.AUTO_DETECT);
    setViewingHistoryItem(null);
    setOriginalTranscription(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `recording-${new Date().getTime()}.webm`, {
          type: 'audio/webm',
        });
        setSelectedFile(file);
        setLanguage(Language.AUTO_DETECT);
        setError(null);
        setTranscription('');
        setOriginalTranscription(null);
        setViewingHistoryItem(null);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure you have given permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTranscribe = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select an audio file first.');
      return;
    }

    if (language === Language.AUTO_DETECT || isDetecting) {
      setError('Please wait for language detection to complete or select a language manually.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTranscription('');
    setOriginalTranscription(null);
    setViewingHistoryItem(null);
    setIsDisplayingOriginal(false);

    try {
      const result = await transcribeAudio(selectedFile, language);
      setTranscription(result);

      const newHistoryItem = {
        id: Date.now(),
        fileName: selectedFile.name,
        language: language,
        transcription: result,
        date: new Date().toLocaleString(),
      };

      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('transcriptionHistory', JSON.stringify(updatedHistory));
      setViewingHistoryItem(newHistoryItem);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, language, isDetecting, history]);

  const handleTranslate = useCallback(async () => {
    if (!transcription || !viewingHistoryItem) {
      setError('No transcription available to translate.');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const sourceText = isDisplayingOriginal ? originalTranscription : transcription;
      const translatedText = await translateText(sourceText, language);

      setOriginalTranscription(sourceText);
      setTranscription(translatedText);
      setIsDisplayingOriginal(false);

      const updatedHistory = history.map((item) =>
        item.id === viewingHistoryItem.id
          ? {
              ...item,
              transcription: translatedText,
              originalTranscription: sourceText,
              date: new Date().toLocaleString() + ' (translated)',
            }
          : item
      );
      setHistory(updatedHistory);
      localStorage.setItem('transcriptionHistory', JSON.stringify(updatedHistory));
      setViewingHistoryItem(
        updatedHistory.find((item) => item.id === viewingHistoryItem.id) || null
      );
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during translation.');
    } finally {
      setIsTranslating(false);
    }
  }, [transcription, originalTranscription, language, viewingHistoryItem, history, isDisplayingOriginal]);

  const handleCopyToClipboard = () => {
    const textToCopy = isDisplayingOriginal ? originalTranscription : transcription;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadTranscription = () => {
    const textToDownload = isDisplayingOriginal ? originalTranscription : transcription;
    if (!textToDownload) return;

    const baseFileName =
      viewingHistoryItem?.fileName || selectedFile?.name || 'transcription.txt';
    const downloadFileName = baseFileName.includes('.')
      ? baseFileName.split('.').slice(0, -1).join('.') + '.txt'
      : baseFileName + '.txt';

    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveChanges = () => {
    if (!viewingHistoryItem) return;

    const updatedHistory = history.map((item) =>
      item.id === viewingHistoryItem.id
        ? {
            ...item,
            transcription: transcription,
            originalTranscription: originalTranscription || undefined,
            date: new Date().toLocaleString() + ' (edited)',
          }
        : item
    );
    setHistory(updatedHistory);
    localStorage.setItem('transcriptionHistory', JSON.stringify(updatedHistory));

    setViewingHistoryItem(
      updatedHistory.find((item) => item.id === viewingHistoryItem.id) || null
    );

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSelectHistoryItem = (item) => {
    setTranscription(item.transcription);
    setOriginalTranscription(item.originalTranscription || null);
    setLanguage(item.language);
    setSelectedFile(null);
    setViewingHistoryItem(item);
    setError(null);
    setIsDisplayingOriginal(false);
  };

  const handleDeleteHistoryItem = (id) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('transcriptionHistory', JSON.stringify(updatedHistory));
    if (viewingHistoryItem?.id === id) {
      setViewingHistoryItem(null);
      setTranscription('');
      setOriginalTranscription(null);
    }
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        'Are you sure you want to clear the entire transcription history? This action cannot be undone.'
      )
    ) {
      setHistory([]);
      localStorage.removeItem('transcriptionHistory');
      setViewingHistoryItem(null);
      setTranscription('');
      setOriginalTranscription(null);
    }
  };

  const handleTextChange = (e) => {
    if (isDisplayingOriginal) {
      setOriginalTranscription(e.target.value);
    } else {
      setTranscription(e.target.value);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const hasEdits =
    viewingHistoryItem &&
    ((isDisplayingOriginal &&
      originalTranscription !== viewingHistoryItem.originalTranscription) ||
      (!isDisplayingOriginal && transcription !== viewingHistoryItem.transcription));

  const resultHeaderText = () => {
    if (isDisplayingOriginal) return 'Original Transcription';
    if (originalTranscription) return 'Translation Result';
    return 'Transcription Result';
  };

  if (showSettings) {
    return (
      <div className="min-h-screen w-full p-4 font-sans text-gray-900 dark:text-gray-200">
        <SharingSettings onClose={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans text-gray-900 dark:text-gray-200">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Settings"
              title="Sharing Settings"
            >
              <SettingsIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="About"
              title="About"
            >
              <InfoIcon className="h-6 w-6" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Digos Doctors Hospital AI Audio Transcriber
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload audio, get accurate transcriptions, and translate to English.
          </p>
          
          {/* PWA Install Button */}
          {showInstallButton && (
            <button
              onClick={handleInstallClick}
              className="mt-4 inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg"
            >
              <DownloadIcon className="h-5 w-5" />
              <span className="font-semibold">Install App</span>
            </button>
          )}
        </header>

        <main className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
          <div>
            <label
              htmlFor="language"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Select Language
            </label>
            <div className="flex items-center space-x-3">
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isDetecting || !!viewingHistoryItem}
                className="w-full bg-gray-100 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {Object.values(Language).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
              {isDetecting && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  <span>Detecting...</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="file-upload"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Upload Audio File
              </label>
              <div
                onClick={() => !isRecording && fileInputRef.current?.click()}
                className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg transition ${
                  isRecording
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:border-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="text-center">
                  <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                      Click to upload
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">MP3, WAV, M4A, etc.</p>
                </div>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={isRecording}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Live Record
              </label>
              <div className="flex flex-col items-center justify-center w-full px-6 py-10 border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-900/20">
                {isRecording ? (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-100">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-red-500/20"
                    >
                      <StopCircleIcon className="h-6 w-6" />
                      <span className="font-bold">Stop Recording</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <MicIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <button
                      onClick={startRecording}
                      disabled={isLoading}
                      className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MicIcon className="h-6 w-6" />
                      <span className="font-bold">Start Recording</span>
                    </button>
                    <p className="text-xs text-gray-500">Record directly from mic</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(selectedFile || viewingHistoryItem) && (
            <div className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AudioFileIcon className="h-6 w-6 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                    {viewingHistoryItem ? viewingHistoryItem.fileName : selectedFile?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {viewingHistoryItem
                      ? `Processed on ${viewingHistoryItem.date}`
                      : formatFileSize(selectedFile?.size || 0)}
                  </p>
                </div>
              </div>
              {selectedFile && !viewingHistoryItem && (
                <button
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600/50 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
                  aria-label="Remove file"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          <div>
            <button
              onClick={handleTranscribe}
              disabled={
                !selectedFile ||
                isLoading ||
                isDetecting ||
                language === Language.AUTO_DETECT
              }
              className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="h-5 w-5 mr-3" />
                  Transcribing...
                </>
              ) : (
                'Transcribe Audio'
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              <p>
                <span className="font-bold">Error:</span> {error}
              </p>
            </div>
          )}

          {(transcription || originalTranscription) && (
            <div className="space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {resultHeaderText()}
                </h3>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  {viewingHistoryItem && (
                    <button
                      onClick={handleSaveChanges}
                      disabled={!hasEdits}
                      className="flex items-center space-x-2 text-sm bg-gray-200 dark:bg-gray-700/80 px-3 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaved ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <SaveIcon className="h-4 w-4" />
                      )}
                      <span>{isSaved ? 'Saved!' : 'Save Edits'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="flex items-center space-x-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-md hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md"
                  >
                    <ShareIcon className="h-4 w-4" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center space-x-2 text-sm bg-gray-200 dark:bg-gray-700/80 px-3 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {isCopied ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTranscription}
                    className="flex items-center space-x-2 text-sm bg-gray-200 dark:bg-gray-700/80 px-3 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTranslate}
                  disabled={
                    language === Language.ENGLISH ||
                    !!originalTranscription ||
                    isTranslating ||
                    !transcription
                  }
                  className="flex items-center justify-center text-sm bg-purple-600/80 px-3 py-1.5 rounded-md hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTranslating ? <LoadingSpinner className="h-4 w-4 mr-2" /> : null}
                  <span>{isTranslating ? 'Translating...' : 'Translate to English'}</span>
                </button>
                {originalTranscription && (
                  <button
                    onClick={() => setIsDisplayingOriginal(!isDisplayingOriginal)}
                    className="text-sm bg-gray-200 dark:bg-gray-700/80 px-3 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {isDisplayingOriginal ? 'Show Translation' : 'Show Original'}
                  </button>
                )}
              </div>
              <textarea
                value={isDisplayingOriginal ? originalTranscription || '' : transcription}
                onChange={handleTextChange}
                className="w-full h-48 bg-gray-50 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-gray-800 dark:text-gray-300 font-mono text-sm resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Result will appear here..."
              />
            </div>
          )}
        </main>

        {history.length > 0 && (
          <section className="mt-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Transcription History
              </h2>
              <button
                onClick={handleClearHistory}
                className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:underline"
              >
                Clear History
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition ${
                    viewingHistoryItem?.id === item.id
                      ? 'bg-indigo-500/20 dark:bg-indigo-600/40'
                      : 'bg-gray-100 dark:bg-gray-700/60 hover:bg-gray-200 dark:hover:bg-gray-700/90'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                      {item.fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.language}
                      {item.originalTranscription ? ' (Translated)' : ''} - {item.date}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistoryItem(item.id);
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600/50 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition flex-shrink-0 ml-2"
                    aria-label="Delete history item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center mt-8">
          <div className="text-xs text-gray-500 flex justify-center items-center space-x-2">
            <span>&copy; {new Date().getFullYear()} Digos Doctors Hospital AI Audio Transcriber.</span>
            <span className="hidden sm:inline">|</span>
            <div className="flex flex-col sm:flex-row sm:space-x-2">
              <span>Version 1.2.1 (Build 20260320.1)</span>
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="hover:underline text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
              >
                About
              </button>
            </div>
          </div>
        </footer>
      </div>
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        transcription={isDisplayingOriginal ? originalTranscription : transcription}
        originalTranscription={isDisplayingOriginal ? transcription : originalTranscription}
        language={language}
        fileName={viewingHistoryItem?.fileName || selectedFile?.name}
      />
    </div>
  );
};

export default App;
