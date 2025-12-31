import { useState, useEffect } from 'react';
import AnalyzeJob from './components/AnalyzeJob';
import ResultsChromaDB from './components/ResultsChromaDB';
import ResultsElastic from './components/ResultsElastic';
import { Database, FlaskConical, FileSearch } from 'lucide-react';
import { elasticsearchApi, initAuth } from './services/api';
import type { AnalysisRequest, AnalysisResult } from './types';

type Tab = 'analyze' | 'chromadb' | 'elastic';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Initialize authentication and load latest analysis on app load
  useEffect(() => {
    const initialize = async () => {
      try {
        await initAuth();
        console.log('Authentication initialized successfully');

        // Load latest analysis if available
        const latestAnalysis = await elasticsearchApi.getLatestAnalysis();
        if (latestAnalysis) {
          setResults(latestAnalysis);
          console.log('Loaded latest analysis from database');
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
      } finally {
        // Mark auth as ready even if there was an error
        // so the UI doesn't stay in loading state forever
        setAuthReady(true);
      }
    };
    initialize();
  }, []);

  const handleAnalyze = async (data: AnalysisRequest, provider: string) => {
    try {
      const result = await elasticsearchApi.analyzeJob(data, provider);
      setResults(result);
      setActiveTab('chromadb');
    } catch (error) {
      console.error('Analysis failed:', error);
      throw error;
    }
  };

  // NO LOGIN REQUIRED FOR ELASTICSEARCH SHOWCASE - Direct Access
  // Authentication is handled automatically using demo user token

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Elasticsearch Showcase</h1>
                <p className="text-sm text-gray-600">ChromaDB vs Elasticsearch Comparison</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Demo User</p>
                <p className="text-xs text-gray-500">Public Access</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'analyze'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileSearch className="w-5 h-5" />
                <span>Analyze Job</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('chromadb')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'chromadb'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-5 h-5" />
                <span>Results ChromaDB</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('elastic')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'elastic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Results Elastic</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!authReady ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'analyze' && <AnalyzeJob onAnalyze={handleAnalyze} />}
            {activeTab === 'chromadb' && <ResultsChromaDB results={results} />}
            {activeTab === 'elastic' && <ResultsElastic results={results} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 Michael Dabrock - Elasticsearch Showcase
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
