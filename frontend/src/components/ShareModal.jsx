import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CloseIcon, CheckIcon, DownloadIcon, CopyIcon, LoadingSpinner } from './Icons';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import axios from 'axios';
import jsPDF from 'jspdf';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ShareModal = ({ isOpen, onClose, transcription, originalTranscription, language, fileName }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeOriginal, setIncludeOriginal] = useState(true);
  const [includeTranslation, setIncludeTranslation] = useState(false);
  const [includeSOAP, setIncludeSOAP] = useState(false);
  const [soapSummary, setSoapSummary] = useState(null);
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [shareFormat, setShareFormat] = useState('plain_text');
  const [previewContent, setPreviewContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const soapGenerationInProgress = useRef(false);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    } else {
      // Reset SOAP when modal closes
      setSoapSummary(null);
      soapGenerationInProgress.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    console.log('🔍 SOAP useEffect check:', {
      isOpen,
      includeSOAP,
      hasSoapSummary: !!soapSummary,
      hasTranscription: !!transcription,
      isGeneratingSOAP,
      inProgress: soapGenerationInProgress.current
    });
    
    if (isOpen && includeSOAP && !soapSummary && transcription && !isGeneratingSOAP && !soapGenerationInProgress.current) {
      console.log('🚀 Triggering SOAP generation from useEffect');
      soapGenerationInProgress.current = true;
      generateSOAPSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, includeSOAP, transcription, soapSummary, isGeneratingSOAP]);

  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Preview update triggered');
      generatePreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, includeOriginal, includeTranslation, includeSOAP, transcription, originalTranscription, soapSummary]);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(`${API}/messenger-contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const generateSOAPSummary = useCallback(async () => {
    if (!transcription || isGeneratingSOAP) return;
    
    console.log('🔍 Starting SOAP generation...');
    console.log('Transcription length:', transcription.length);
    console.log('Language:', language);
    
    setIsGeneratingSOAP(true);
    try {
      console.log('📤 Sending request to /api/generate-soap');
      const response = await axios.post(`${API}/generate-soap`, {
        transcription: transcription,
        language: language
      });
      console.log('✅ SOAP generated successfully:', response.data);
      setSoapSummary(response.data);
    } catch (error) {
      console.error('❌ Error generating SOAP:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Fallback to template if generation fails
      setSoapSummary({
        subjective: 'AI generation failed. Please fill manually.',
        objective: 'AI generation failed. Please fill manually.',
        assessment: 'AI generation failed. Please fill manually.',
        plan: 'AI generation failed. Please fill manually.'
      });
    } finally {
      setIsGeneratingSOAP(false);
      soapGenerationInProgress.current = false;
      console.log('🏁 SOAP generation completed');
    }
  }, [transcription, language, isGeneratingSOAP]);

  const generatePreview = useCallback(() => {
    console.log('📋 Generating preview...');
    console.log('includeSOAP:', includeSOAP);
    console.log('soapSummary:', soapSummary);
    console.log('isGeneratingSOAP:', isGeneratingSOAP);
    
    let content = '';
    
    if (fileName) {
      content += `File: ${fileName}\n`;
      content += `Language: ${language}\n`;
      content += `Date: ${new Date().toLocaleString()}\n\n`;
      content += '─'.repeat(40) + '\n\n';
    }

    if (includeOriginal && transcription) {
      content += `TRANSCRIPTION:\n${transcription}\n\n`;
    }

    if (includeTranslation && originalTranscription) {
      content += `ENGLISH TRANSLATION:\n${originalTranscription}\n\n`;
    }

    if (includeSOAP) {
      content += `SOAP SUMMARY:\n\n`;
      if (soapSummary && !isGeneratingSOAP) {
        console.log('✅ Using generated SOAP summary');
        content += `S (Subjective): ${soapSummary.subjective}\n\n`;
        content += `O (Objective): ${soapSummary.objective}\n\n`;
        content += `A (Assessment): ${soapSummary.assessment}\n\n`;
        content += `P (Plan): ${soapSummary.plan}\n\n`;
      } else if (isGeneratingSOAP) {
        console.log('⏳ SOAP is being generated...');
        content += `⏳ Generating AI-powered SOAP summary...\n\n`;
      } else {
        console.log('⚠️ SOAP not yet generated');
        content += `⏳ AI-powered SOAP will be generated automatically...\n\n`;
      }
    }

    content += '─'.repeat(40) + '\n';
    content += 'Generated by Smart Transcriber\n';
    content += '© ' + new Date().getFullYear() + ' Smart Transcriber\n';

    setPreviewContent(content);
  }, [fileName, language, includeOriginal, transcription, includeTranslation, originalTranscription, includeSOAP, soapSummary, isGeneratingSOAP]);

  const filteredContacts = contacts.filter(contact =>
    contact.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.messenger_username && contact.messenger_username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCopyText = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (shareFormat === 'pdf') {
      generatePDF();
    } else {
      // Download as TXT
      const blob = new Blob([previewContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription_${new Date().getTime()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    logShare('download');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let y = margin;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Smart Transcriber', pageWidth / 2, y, { align: 'center' });
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.text('AI Audio Transcription Report', pageWidth / 2, y, { align: 'center' });
    y += lineHeight * 2;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`File: ${fileName}`, margin, y);
    y += lineHeight;
    doc.text(`Language: ${language}`, margin, y);
    y += lineHeight;
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, y);
    y += lineHeight * 2;

    // Content
    doc.setFont('helvetica', 'normal');
    const lines = previewContent.split('\n');
    
    lines.forEach(line => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      if (line.includes('TRANSCRIPTION:') || line.includes('ENGLISH TRANSLATION:') || line.includes('SOAP SUMMARY:')) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const wrappedLines = doc.splitTextToSize(line, pageWidth - 2 * margin);
      wrappedLines.forEach(wrappedLine => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(wrappedLine, margin, y);
        y += lineHeight;
      });
    });

    doc.save(`transcription_${new Date().getTime()}.pdf`);
  };

  const handleOpenMessenger = async () => {
    if (!showPrivacyConfirm) {
      setShowPrivacyConfirm(true);
      return;
    }

    setIsSharing(true);

    // Copy content to clipboard
    await navigator.clipboard.writeText(previewContent);

    // Try to open Messenger
    const messengerUsername = selectedContact?.messenger_username;
    
    if (messengerUsername) {
      // Try deep link first
      window.location.href = `fb-messenger://user/${messengerUsername}`;
      
      // Fallback to web after short delay
      setTimeout(() => {
        window.open(`https://m.me/${messengerUsername}`, '_blank');
      }, 1000);
    } else {
      // Open Messenger home if no username
      window.open('https://www.messenger.com/', '_blank');
    }

    logShare('messenger');
    setIsSharing(false);
    
    alert('Content copied to clipboard! Paste it in Messenger.');
    onClose();
  };

  const logShare = async (method) => {
    try {
      await axios.post(`${API}/shared-transcriptions`, {
        transcript_id: `${Date.now()}`,
        recipient_name: selectedContact?.display_name || 'Unknown',
        recipient_contact_id: selectedContact?.id,
        share_format: shareFormat,
        share_method: method,
        content_options: {
          include_original: includeOriginal,
          include_translation: includeTranslation,
          include_soap: includeSOAP
        },
        status: 'completed'
      });
    } catch (error) {
      console.error('Error logging share:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 text-gray-800 dark:text-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          aria-label="Close modal"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 mb-6">
          Share Transcription
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Settings */}
          <div className="space-y-6">
            {/* Recipient Selection - REMOVED */}

            {/* Content Options */}
            <div>
              <Label className="block text-sm font-medium mb-2">Include in Share</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-original"
                    checked={includeOriginal}
                    onCheckedChange={setIncludeOriginal}
                  />
                  <label htmlFor="include-original" className="text-sm cursor-pointer">
                    Original Transcription
                  </label>
                </div>
                {originalTranscription && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-translation"
                      checked={includeTranslation}
                      onCheckedChange={setIncludeTranslation}
                    />
                    <label htmlFor="include-translation" className="text-sm cursor-pointer">
                      English Translation
                    </label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-soap"
                    checked={includeSOAP}
                    onCheckedChange={(checked) => {
                      setIncludeSOAP(checked);
                      if (checked) {
                        console.log('📋 SOAP checkbox checked - will generate');
                        setSoapSummary(null); // Reset to trigger generation
                        soapGenerationInProgress.current = false;
                      }
                    }}
                  />
                  <label htmlFor="include-soap" className="text-sm cursor-pointer flex items-center space-x-2">
                    <span>AI-Generated SOAP Summary</span>
                    {isGeneratingSOAP && (
                      <LoadingSpinner className="h-4 w-4 text-indigo-600" />
                    )}
                  </label>
                  {includeSOAP && !isGeneratingSOAP && !soapSummary && (
                    <button
                      onClick={() => {
                        console.log('🔘 Manual SOAP generation triggered');
                        generateSOAPSummary();
                      }}
                      className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                    >
                      Generate Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <Label className="block text-sm font-medium mb-2">Share Format</Label>
              <Select value={shareFormat} onValueChange={setShareFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain_text">Plain Text</SelectItem>
                  <SelectItem value="txt">TXT File</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div>
            <Label className="block text-sm font-medium mb-2">Preview</Label>
            <div className="h-[400px] overflow-y-auto bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {previewContent}
              </pre>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopyText}
              className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              title="Copy transcription to clipboard"
            >
              {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon className="h-5 w-5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
              title={`Download as ${shareFormat === 'pdf' ? 'PDF' : 'TXT'}`}
            >
              <DownloadIcon className="h-5 w-5" />
              <span>Download {shareFormat === 'pdf' ? 'PDF' : 'TXT'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
