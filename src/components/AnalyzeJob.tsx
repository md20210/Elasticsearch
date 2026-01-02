import { useState, useEffect } from 'react';
import { Sparkles, Upload, FileText, Loader2, Trash2 } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { elasticsearchApi } from '../services/api';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function AnalyzeJob() {
  const [cvText, setCvText] = useState('');
  const [provider, setProvider] = useState('grok');
  const [skipProcessing, setSkipProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      let text = '';

      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      // Handle Word documents (.docx)
      if (fileName.endsWith('.docx') || fileType.includes('wordprocessingml')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      }
      // Handle old Word documents (.doc)
      else if (fileName.endsWith('.doc') || fileType.includes('msword')) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://general-backend-production-a734.up.railway.app/elasticsearch/parse-doc', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Failed to parse .doc file');
        const result = await response.json();
        text = result.text;
      }
      // Handle plain text files
      else if (fileName.endsWith('.txt') || fileType === 'text/plain') {
        text = await file.text();
      }
      // PDF files
      else if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
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
      } else {
        setError(`Unsupported file type: ${file.name}. Please use .txt, .doc, .docx, or .pdf files.`);
        return;
      }

      if (!text || text.trim().length === 0) {
        setError('File appears to be empty. Please check the file and try again.');
        return;
      }

      setCvText(text);
      setError('');
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
      if (skipProcessing) {
        setImportStatus('Raw Import: Importing to databases (AI processing skipped)...');
      } else {
        setImportStatus('Clearing old data and importing to pgvector & Elasticsearch...');
      }
      const profileData = {
        cv_text: cvText,
      };

      const result = await elasticsearchApi.createProfile(profileData, provider, skipProcessing);
      console.log('Profile created/imported successfully (old data automatically cleared)', result);

      // Success - show detailed 7-step summary with real status
      setImportStatus('');

      if (skipProcessing) {
        // Simple success message for raw import
        const step5Status = result.elasticsearch_indexed ? '✅' : '❌';
        const step7Status = (result.pgvector_chunks && result.pgvector_chunks > 0) ? '✅' : '❌';

        setSuccess(
          `✅ Raw Import abgeschlossen!\n\n` +
          `✅ Schritt 1/3: Alte Daten gelöscht\n` +
          `${step5Status} Schritt 2/3: Elasticsearch indexiert (Raw Text)\n` +
          `${step7Status} Schritt 3/3: pgvector (${result.pgvector_chunks || 0} chunks)\n\n` +
          `⚠️ Hinweis: AI-Verarbeitung wurde übersprungen`
        );
      } else {
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
      }
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
          <h3 className="text-lg font-bold text-gray-900">Your CV/Resume (Optional)</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition">
            <Upload className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">Upload CV File (.txt, .doc, .docx, .pdf)</span>
            <input
              type="file"
              className="hidden"
              accept=".txt,.doc,.docx,.pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
          <div className="text-center text-gray-500 text-sm">OR</div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste CV/Resume Text
            </label>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your CV/Resume text here..."
              className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
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

      {/* Data Processing Options */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Data Processing Options</h3>
        </div>
        <div className="space-y-3">
          <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-900">
              <strong>What is data processing?</strong> When enabled, your CV data will be analyzed by AI to extract skills, experience, education, and job titles. This provides better search results but takes longer.
            </p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="processing"
                checked={!skipProcessing}
                onChange={() => setSkipProcessing(false)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Enable Data Processing (Recommended)</div>
                <div className="text-sm text-gray-600">AI analyzes CV, extracts skills - best search results</div>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="processing"
                checked={skipProcessing}
                onChange={() => setSkipProcessing(true)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Skip Data Processing (Raw Import)</div>
                <div className="text-sm text-gray-600">No AI analysis - faster import, limited extraction</div>
              </div>
            </label>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Processing ON
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Processing OFF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">LLM CV-Analyse</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">✅ Ja</td>
                  <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">❌ Nein</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">Skill-Extraktion</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">✅ Ja</td>
                  <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">❌ Nein</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">Text-Deduplizierung</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">✅ Ja</td>
                  <td className="px-4 py-3 text-sm text-center text-red-600 font-medium">❌ Nein</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900">Elasticsearch Index</td>
                  <td className="px-4 py-3 text-sm text-center text-blue-600 font-medium">Strukturiert</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 font-medium">Raw</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">pgvector Chunks</td>
                  <td className="px-4 py-3 text-sm text-center text-blue-600 font-medium">Optimiert</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600 font-medium">Raw</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">Import-Geschwindigkeit</td>
                  <td className="px-4 py-3 text-sm text-center text-orange-600 font-medium">Langsamer</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 font-medium">✅ Schneller</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
