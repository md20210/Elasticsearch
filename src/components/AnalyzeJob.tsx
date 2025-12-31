import { useState, useEffect } from 'react';
import { Sparkles, Upload, Link as LinkIcon, FileText, Loader2, Trash2, Globe } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import type { AnalysisRequest } from '../types';
import { elasticsearchApi } from '../services/api';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AnalyzeJobProps {
  onAnalyze: (data: AnalysisRequest, provider: string) => void;
}

export default function AnalyzeJob({ onAnalyze }: AnalyzeJobProps) {
  const [cvText, setCvText] = useState('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [homepageUrl, setHomepageUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [provider, setProvider] = useState('grok');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved profile data and latest analysis on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load profile data
        const profile = await elasticsearchApi.getProfile();
        if (profile) {
          setCvText(profile.cv_text || '');
          setCoverLetterText(profile.cover_letter_text || '');
          setHomepageUrl(profile.homepage_url || '');
          setLinkedinUrl(profile.linkedin_url || '');
          console.log('Loaded saved profile data');
        }

        // Load latest analysis to pre-fill job fields
        const latestAnalysis = await elasticsearchApi.getLatestAnalysis();
        if (latestAnalysis && latestAnalysis.job_description) {
          setJobDescription(latestAnalysis.job_description);
          setJobUrl(latestAnalysis.job_url || '');
          console.log('Loaded latest job analysis data');
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
        // Don't show error to user - just start with empty fields
      }
    };

    loadData();
  }, []);

  const handleFileUpload = async (file: File, type: 'cv' | 'coverLetter' | 'job') => {
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

      if (type === 'cv') setCvText(text);
      else if (type === 'coverLetter') setCoverLetterText(text);
      else setJobDescription(text);

      setError('');
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(`Failed to parse ${file.name}. Please try copying and pasting the text instead.`);
    }
  };

  const handleLoadFromUrl = async (url: string, type: 'cv' | 'job') => {
    if (!url) return;

    try {
      setError('');
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load document from URL');
      }

      const text = await response.text();
      if (type === 'cv') {
        setCvText(text);
      } else {
        setJobDescription(text);
      }
    } catch (err) {
      console.error('Error loading from URL:', err);
      setError('Failed to load from URL. This may be due to CORS restrictions. Please try copy/paste instead.');
    }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data: AnalysisRequest = {
        cv_text: cvText || undefined,
        cover_letter_text: coverLetterText || undefined,
        homepage_url: homepageUrl || undefined,
        linkedin_url: linkedinUrl || undefined,
        job_description: jobDescription || undefined,
        job_url: jobUrl || undefined,
        provider,
      };

      await onAnalyze(data, provider);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setCvText('');
    setCoverLetterText('');
    setHomepageUrl('');
    setLinkedinUrl('');
    setJobUrl('');
    setJobDescription('');
    setError('');
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
                if (file) handleFileUpload(file, 'cv');
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

      {/* Cover Letter */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Your Cover Letter (Optional)</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition">
            <Upload className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">Upload Cover Letter (.txt, .doc, .docx, .pdf)</span>
            <input
              type="file"
              className="hidden"
              accept=".txt,.doc,.docx,.pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'coverLetter');
              }}
            />
          </label>
          <div className="text-center text-gray-500 text-sm">OR</div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste Cover Letter Text
            </label>
            <textarea
              value={coverLetterText}
              onChange={(e) => setCoverLetterText(e.target.value)}
              placeholder="Paste your cover letter here..."
              className="w-full h-32 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* URLs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <LinkIcon className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">Additional Information (Optional)</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Homepage URL
            </label>
            <input
              type="url"
              value={homepageUrl}
              onChange={(e) => setHomepageUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Job Description</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description URL
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://company.com/careers/job-posting"
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={() => handleLoadFromUrl(jobUrl, 'job')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>Load</span>
              </button>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm">OR</div>
          <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition">
            <Upload className="w-4 h-4 mr-2 text-gray-500" />
            <span className="text-sm text-gray-600">Upload Job Description (.txt, .doc, .docx, .pdf)</span>
            <input
              type="file"
              className="hidden"
              accept=".txt,.doc,.docx,.pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, 'job');
              }}
            />
          </label>
          <div className="text-center text-gray-500 text-sm">OR</div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* LLM Provider */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">LLM Provider</h3>
        </div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="grok">Grok (X.AI)</option>
          <option value="anthropic">Claude (Anthropic)</option>
          <option value="openai">GPT-4 (OpenAI)</option>
          <option value="ollama">Ollama (Local)</option>
        </select>
      </div>

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
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Analyze & Compare</span>
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
