import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import { BottomNav } from './components/BottomNav';
import HomePage from './components/HomePage';
import RecordingView from './components/RecordingView';
import ProcessingView from './components/ProcessingView';
import TranscriptionView from './components/TranscriptionView';
import TranscriptsListView from './components/TranscriptsListView';
import SettingsView from './components/SettingsView';
import { AboutModal } from './components/AboutModal';
import { ShareModal } from './components/ShareModal';
import { Loader2 } from 'lucide-react';
import {
  fetchHistory,
  createHistoryItem,
  updateHistoryItem,
  deleteHistoryItem,
  clearAllHistory,
} from './services/apiService';

const App = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [currentView, setCurrentView] = useState('home');
  const [selectedFile, setSelectedFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [originalTranscription, setOriginalTranscription] = useState(null);
  const [language, setLanguage] = useState('English');
  const [fileName, setFileName] = useState('');
  const [currentMode, setCurrentMode] = useState('general');
  const [history, setHistory] = useState([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Load history from server
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadHistory = async () => {
      const serverHistory = await fetchHistory();
      const mapped = serverHistory.map((item) => ({
        id: item.id,
        fileName: item.file_name,
        language: item.language,
        transcription: item.transcription,
        originalTranscription: item.original_transcription || null,
        date: item.date,
      }));
      setHistory(mapped);
    };
    loadHistory();
  }, [isAuthenticated]);

  // Handle file selection from home page
  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setTranscription('');
    setOriginalTranscription(null);
    setViewingHistoryItem(null);
    setCurrentView('processing');
  }, []);

  // Handle recording completion
  const handleRecordingComplete = useCallback((file) => {
    setSelectedFile(file);
    setTranscription('');
    setOriginalTranscription(null);
    setViewingHistoryItem(null);
    setCurrentView('processing');
  }, []);

  // Handle transcription completion
  const handleTranscriptionComplete = useCallback(async (result) => {
    setTranscription(result.transcription);
    setLanguage(result.language);
    setFileName(result.fileName);
    setCurrentMode(result.mode);
    setOriginalTranscription(null);

    // Save to server
    try {
      const saved = await createHistoryItem({
        fileName: result.fileName,
        language: result.language,
        transcription: result.transcription,
        date: new Date().toLocaleString(),
      });
      const mappedItem = {
        id: saved.id,
        fileName: saved.file_name,
        language: saved.language,
        transcription: saved.transcription,
        originalTranscription: saved.original_transcription || null,
        date: saved.date,
      };
      setHistory((prev) => [mappedItem, ...prev]);
      setViewingHistoryItem(mappedItem);
    } catch (e) {
      console.error('Failed to save history:', e);
    }

    setCurrentView('view');
  }, []);

  // Handle selecting a history item
  const handleSelectHistoryItem = useCallback((item) => {
    setTranscription(item.transcription);
    setOriginalTranscription(item.originalTranscription || null);
    setLanguage(item.language);
    setFileName(item.fileName);
    setViewingHistoryItem(item);
    setCurrentView('view');
  }, []);

  // Handle deleting a history item
  const handleDeleteHistoryItem = useCallback(async (id) => {
    try {
      await deleteHistoryItem(id);
    } catch (e) {
      console.error('Failed to delete:', e);
    }
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (viewingHistoryItem?.id === id) {
      setViewingHistoryItem(null);
      setTranscription('');
      setCurrentView('transcripts');
    }
  }, [viewingHistoryItem]);

  // Handle clearing all history
  const handleClearAll = useCallback(async () => {
    if (!window.confirm('Clear all transcripts? This cannot be undone.')) return;
    try {
      await clearAllHistory();
    } catch (e) {
      console.error('Failed to clear:', e);
    }
    setHistory([]);
    setViewingHistoryItem(null);
    setTranscription('');
  }, []);

  // Handle text change in transcript editor
  const handleTextChange = useCallback((newText) => {
    setTranscription(newText);
    if (viewingHistoryItem) {
      updateHistoryItem(viewingHistoryItem.id, {
        transcription: newText,
        date: new Date().toLocaleString() + ' (edited)',
      }).catch(() => {});
      setHistory((prev) =>
        prev.map((item) =>
          item.id === viewingHistoryItem.id
            ? { ...item, transcription: newText, date: new Date().toLocaleString() + ' (edited)' }
            : item
        )
      );
    }
  }, [viewingHistoryItem]);

  // Navigation handler
  const handleNavigate = useCallback((view) => {
    setCurrentView(view);
  }, []);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg)]">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Auth gate
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Main Content */}
      <div className="pb-safe">
        {currentView === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onFileSelect={handleFileSelect}
            historyCount={history.length}
          />
        )}

        {currentView === 'record' && (
          <RecordingView
            onRecordingComplete={handleRecordingComplete}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'processing' && selectedFile && (
          <ProcessingView
            file={selectedFile}
            onComplete={handleTranscriptionComplete}
            onBack={() => setCurrentView('home')}
          />
        )}

        {currentView === 'view' && (
          <TranscriptionView
            transcription={transcription}
            originalTranscription={originalTranscription}
            language={language}
            fileName={fileName}
            mode={currentMode}
            onBack={() => setCurrentView(viewingHistoryItem ? 'transcripts' : 'home')}
            onTextChange={handleTextChange}
            onOpenShare={() => setIsShareModalOpen(true)}
          />
        )}

        {currentView === 'transcripts' && (
          <TranscriptsListView
            history={history}
            onSelect={handleSelectHistoryItem}
            onDelete={handleDeleteHistoryItem}
            onClearAll={handleClearAll}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView onOpenAbout={() => setIsAboutModalOpen(true)} />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentView={currentView} onNavigate={handleNavigate} />

      {/* Modals */}
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        transcription={transcription}
        originalTranscription={originalTranscription}
        language={language}
        fileName={fileName}
      />
    </div>
  );
};

export default App;
