import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AnalyzeJob from './components/AnalyzeJob';
import ResultsChromaDB from './components/ResultsChromaDB';
import ResultsElastic from './components/ResultsElastic';
import { Database, FlaskConical, LogOut, FileSearch } from 'lucide-react';
import { elasticsearchApi } from './services/api';
import type { AnalysisRequest, AnalysisResult } from './types';

type Tab = 'analyze' | 'chromadb' | 'elastic';

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [results, setResults] = useState<AnalysisResult | null>(null);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showLogin ? (
            <Login
              onLoginSuccess={() => {}}
              onSwitchToRegister={() => setShowLogin(false)}
            />
          ) : (
            <Register
              onRegisterSuccess={() => {}}
              onSwitchToLogin={() => setShowLogin(true)}
            />
          )}
        </div>
      </div>
    );
  }

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
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">Logged in</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
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
        {activeTab === 'analyze' && <AnalyzeJob onAnalyze={handleAnalyze} />}
        {activeTab === 'chromadb' && <ResultsChromaDB results={results} />}
        {activeTab === 'elastic' && <ResultsElastic />}
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
