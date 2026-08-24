import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, ChevronLeft, WifiOff, Wifi } from 'lucide-react';
import { savePendingRecording } from '../services/offlineQueue';

const RecordingView = ({ onRecordingComplete, onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [savedOffline, setSavedOffline] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      setSavedOffline(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());

        if (navigator.onLine) {
          onRecordingComplete(file);
        } else {
          // Save offline
          try {
            await savePendingRecording(file);
            setSavedOffline(true);
          } catch (e) {
            setError('Failed to save recording offline.');
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch (err) {
      setError('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className="px-4 pt-4 pb-safe max-w-md mx-auto flex flex-col min-h-[calc(100vh-5rem)]">
      <button
        onClick={onBack}
        data-testid="recording-back-btn"
        className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mb-6 -ml-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Connectivity status */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-4 py-2.5 rounded-xl text-sm mb-6 w-full" data-testid="offline-banner">
            <WifiOff className="h-4 w-4 flex-shrink-0" />
            <span>You're offline. Recording will be saved and processed when connectivity returns.</span>
          </div>
        )}

        {savedOffline && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm mb-6 w-full" data-testid="saved-offline-msg">
            <Wifi className="h-4 w-4 flex-shrink-0" />
            <span>Recording saved offline! It will auto-process when you're back online.</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm mb-6 w-full" data-testid="recording-error">
            {error}
          </div>
        )}

        {/* Timer */}
        <div className="text-5xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 mb-10" data-testid="recording-timer">
          {formatTime(recordingTime)}
        </div>

        {/* Record Button */}
        <div className="relative mb-6">
          {isRecording && (
            <div className="absolute inset-0 rounded-full bg-red-500/30 animate-record-pulse" style={{ width: '128px', height: '128px', margin: '-8px' }} />
          )}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            data-testid="record-button"
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-emerald-800 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500'
            }`}
          >
            {isRecording ? (
              <Square className="h-10 w-10 text-white" fill="white" />
            ) : (
              <Mic className="h-10 w-10 text-white" strokeWidth={2} />
            )}
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>
      </div>
    </div>
  );
};

export default RecordingView;
