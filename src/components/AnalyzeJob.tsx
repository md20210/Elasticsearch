import { useState, useEffect } from 'react';
import { Sparkles, Upload, FileText, Loader2, Trash2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { elasticsearchApi } from '../services/api';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function AnalyzeJob() {
  const [cvText, setCvText] = useState('');
  const [provider, setProvider] = useState('grok');
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Load saved profile data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile data
        const profile = await elasticsearchApi.getProfile();
        if (profile) {
          setCvText(profile.cv_text || '');
          console.log('Loaded saved profile data');
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
        // Don't show error to user - just start with empty fields
      }
    };

    loadData();
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      let text = '';

      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB. Please use a smaller file or copy/paste the text instead.`);
        return;
      }

      // Handle Word documents (.docx and .doc) - send to server for processing
      if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml') ||
          fileName.endsWith('.doc') || fileType.includes('msword')) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('https://general-backend-production-a734.up.railway.app/elasticsearch/parse-doc', {
            method: 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to parse Word document');
          }

          const result = await response.json();
          text = result.text;
        } catch (docErr) {
          console.error('Word document parsing error:', docErr);
          setError(`Failed to parse Word document: ${file.name}. ${docErr instanceof Error ? docErr.message : 'Unknown error'}. Please try copying the text manually.`);
          return;
        }
      }
      // Handle plain text files
      else if (fileName.endsWith('.txt') || fileType === 'text/plain') {
        text = await file.text();
      }
      // PDF files
      else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;

          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          text = fullText;
        } catch (pdfErr) {
          console.error('PDF parsing error:', pdfErr);
          setError(`Failed to parse PDF file: ${file.name}. The file may be password-protected or corrupted. Please try: 1) Copying the text manually, 2) Saving as .txt instead.`);
          return;
        }
      } else {
        setError(`Unsupported file type: ${file.name}. Please use .txt, .doc, .docx, or .pdf files.`);
        return;
      }

      if (!text || text.trim().length === 0) {
        setError('File appears to be empty or contains no readable text. Please check the file and try again.');
        return;
      }

      setCvText(text);
      setError('');
      setSuccess(`✅ Successfully loaded ${(text.length / 1024).toFixed(1)}KB of text from ${file.name}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(`Failed to parse ${file.name}. Please try copying and pasting the text instead.`);
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    setImportStatus('');

    try {
      // Validate that at least CV text is provided
      if (!cvText || cvText.trim().length === 0) {
        throw new Error('Please provide your CV/Resume text before importing.');
      }

      // Import data to both databases (backend automatically clears old data first)
      setImportStatus('Clearing old data and importing to pgvector & Elasticsearch...');

      const profileData = {
        cv_text: cvText,
      };

      const result = await elasticsearchApi.createProfile(profileData, provider, false);
      console.log('Profile created/imported successfully (old data automatically cleared)', result);

      // Success - show detailed 7-step summary with real status
      setImportStatus('');

      // Detailed success message with AI processing
      const skillsCount = result.skills_extracted?.length || 0;
      const experience = result.experience_years ? `${result.experience_years} years` : 'N/A';
      const education = result.education_level || 'N/A';
      const jobTitles = result.job_titles?.length || 0;

      // Build status message with real import results
      const step4Status = result.elasticsearch_indexed ? '✅' : '❌';
      const step5Status = (result.pgvector_chunks && result.pgvector_chunks > 0) ? '✅' : '❌';

      setSuccess(
        `✅ CV Import abgeschlossen!\n\n` +
        `✅ Schritt 1/5: LLM-Analyse abgeschlossen\n` +
        `✅ Schritt 2/5: Profil in Datenbank gespeichert\n` +
        `✅ Schritt 3/5: Alte Daten gelöscht\n` +
        `${step4Status} Schritt 4/5: Elasticsearch indexiert\n` +
        `${step5Status} Schritt 5/5: pgvector (${result.pgvector_chunks || 0} chunks)\n\n` +
        `📊 Extrahierte Daten:\n` +
        `   • Skills: ${skillsCount}\n` +
        `   • Erfahrung: ${experience}\n` +
        `   • Ausbildung: ${education}\n` +
        `   • Job Titel: ${jobTitles}`
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Import failed';
      setError(errorMessage);
      setImportStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCvText('');
    setError('');
    setSuccess('');
    setImportStatus('');
  };

  return (
    <div className="space-y-6">
      {/* CV/Resume */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Your CV/Resume</h3>
        </div>

        {/* Recommendation Banner */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>💡 Recommended:</strong> Open your CV in Word/PDF viewer and <strong>copy & paste the text below</strong>.
            This is more reliable than file upload and works with any document format.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste CV/Resume Text (Recommended)
            </label>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your CV/Resume text here..."
              className="w-full h-96 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              style={{ minHeight: '400px', maxHeight: '800px' }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Current length: {cvText.length.toLocaleString()} characters
            </p>
          </div>

          {/* File Upload as Alternative - Drag & Drop */}
          <details className="border border-gray-200 rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
              Alternative: Drag & Drop File (.txt, .pdf recommended - .docx may fail)
            </summary>
            <div className="p-4 border-t border-gray-200">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className={`flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed rounded-lg transition ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-sm text-gray-600 font-medium mb-1">
                  {isDragging ? 'Drop your file here' : 'Drag & Drop your CV file here'}
                </p>
                <p className="text-xs text-gray-500">
                  Supports .txt, .pdf, .docx (max 10MB)
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ .docx files may fail if corrupted. If upload fails, please copy/paste the text instead.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* LLM Provider */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">AI Model for CV Analysis</h3>
        </div>
        <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-900">
            <strong>Why needed?</strong> The AI model intelligently extracts skills, experience years, education level, and job titles from your CV - far more accurate than simple text parsing. This ensures better search results and matching.
          </p>
        </div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="grok">Grok Cloud API (faster, external processing)</option>
          <option value="anthropic">Claude (Anthropic) - Highest Quality</option>
          <option value="ollama">Local & GDPR-compliant (llama3.2:3b)</option>
        </select>
      </div>


      {/* Import Status */}
      {importStatus && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg whitespace-pre-line">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Importing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Import</span>
            </>
          )}
        </button>
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Trash2 className="w-5 h-5" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
}
