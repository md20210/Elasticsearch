import { useState, useEffect } from 'react';
import { Search, Database, FlaskConical, Award, Clock, Sparkles, Upload } from 'lucide-react';

interface ComparisonResult {
  question: string;
  pgvector: {
    answer: string;
    chunks: any[];
    retrieval_time_ms: number;
    score: number;
  };
  elasticsearch: {
    answer: string;
    chunks: any[];
    retrieval_time_ms: number;
    score: number;
  };
  evaluation: {
    winner: string;
    reasoning: string;
    pgvector_score: number;
    elasticsearch_score: number;
  };
  llm_used: string;
  timestamp: string;
}

export default function ComparisonTab() {
  const [question, setQuestion] = useState('');
  const [selectedLLM, setSelectedLLM] = useState<'local' | 'grok'>('grok');
  const [loading, setLoading] = useState(false);
  const [uploadingQuestions, setUploadingQuestions] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>(() => {
    // Load saved results from localStorage on mount
    const saved = localStorage.getItem('comparison_results');
    console.log('📊 Loading comparison results from localStorage:', saved ? `Found ${JSON.parse(saved).length} results` : 'No saved results');
    return saved ? JSON.parse(saved) : [];
  });
  const [error, setError] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string>('llama3.2:3b');

  // Save results to localStorage whenever they change
  useEffect(() => {
    console.log('💾 Saving comparison results to localStorage:', results.length, 'results');
    localStorage.setItem('comparison_results', JSON.stringify(results));
  }, [results]);

  // Load current model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        const response = await fetch(
          'https://general-backend-production-a734.up.railway.app/elasticsearch/current-model',
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentModel(data.model);
        }
      } catch (error) {
        console.error('Failed to load current model:', error);
      }
    };
    loadModel();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://general-backend-production-a734.up.railway.app/elasticsearch/compare-query?question=${encodeURIComponent(question)}&provider=${selectedLLM}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ComparisonResult = await response.json();

      // Add new result to the beginning of the array
      setResults([data, ...results]);
      setQuestion(''); // Clear input after successful submission
    } catch (err) {
      console.error('Failed to compare query:', err);
      setError(err instanceof Error ? err.message : 'Failed to compare query');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadQuestions = async (file: File) => {
    setUploadingQuestions(true);
    setError(null);

    try {
      // Read file content
      const text = await file.text();
      const questions = text
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      if (questions.length === 0) {
        throw new Error('No questions found in file');
      }

      if (questions.length > 50) {
        throw new Error('Maximum 50 questions allowed');
      }

      // Process each question
      const newResults: ComparisonResult[] = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        console.log(`Processing question ${i + 1}/${questions.length}: ${q}`);

        try {
          const response = await fetch(
            `https://general-backend-production-a734.up.railway.app/elasticsearch/compare-query?question=${encodeURIComponent(q)}&provider=${selectedLLM}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const data: ComparisonResult = await response.json();
            newResults.push(data);
          } else {
            console.error(`Failed to process question: ${q}`);
          }
        } catch (err) {
          console.error(`Error processing question: ${q}`, err);
        }

        // Small delay to avoid overwhelming the server
        if (i < questions.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Add all new results to the beginning
      setResults([...newResults, ...results]);
      console.log(`Successfully processed ${newResults.length}/${questions.length} questions`);
    } catch (err) {
      console.error('Failed to upload questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload questions');
    } finally {
      setUploadingQuestions(false);
    }
  };

  const getWinnerColor = (database: string, winner: string) => {
    if (winner === database) {
      return 'bg-green-50 border-green-500';
    } else if (winner === 'tie') {
      return 'bg-yellow-50 border-yellow-500';
    } else {
      return 'bg-red-50 border-red-500';
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Show all results in scrollable frame
  const visibleResults = results; // Display all results

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Vector Database Q&A Comparison</h1>
        </div>
        <p className="text-xl text-blue-100 mb-2">
          Query your CV data and compare pgvector vs Elasticsearch
        </p>
        <p className="text-sm text-blue-200">
          Both databases use their full capabilities to answer questions
        </p>
      </div>

      {/* Question Input Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Question Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. How long did Michael work at Cognizant?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* LLM Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model for Answers
              </label>
              <select
                value={selectedLLM}
                onChange={(e) => setSelectedLLM(e.target.value as 'local' | 'grok')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="local">Local & GDPR-compliant ({currentModel})</option>
                <option value="grok">Grok Cloud API (faster, external processing)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Comparing...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Ask Question & Compare</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {uploadingQuestions && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800">
                Processing questions... This may take a moment.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>💡 Tip:</strong> Upload a .txt file with one question per line (max 50 questions).
            Each question will be automatically compared between pgvector and Elasticsearch.
          </p>
        </div>
      </div>

      {/* Upload Questions Button - Always Visible */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Bulk Question Upload</h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload multiple questions at once for batch comparison
            </p>
          </div>
          <label className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition cursor-pointer flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>
              {uploadingQuestions ? 'Uploading...' : 'Upload Questions'}
            </span>
            <input
              type="file"
              className="hidden"
              accept=".txt,text/plain"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadQuestions(file);
              }}
              disabled={uploadingQuestions || loading}
            />
          </label>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Comparison Results
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {results.length} question{results.length !== 1 ? 's' : ''} asked (scroll to see all)
              </p>
            </div>
            <button
              onClick={() => {
                setResults([]);
                localStorage.removeItem('comparison_results');
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition text-sm"
            >
              Clear All Results
            </button>
          </div>

          <div className="overflow-x-auto" style={{ maxHeight: '800px', overflowY: 'auto' }}>
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    pgvector Answer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Elasticsearch Answer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {/* Question Column */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                      <div className="flex items-start space-x-2">
                        <Search className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{result.question}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString('de-DE')}
                      </div>
                    </td>

                    {/* pgvector Answer Column */}
                    <td className={`px-6 py-4 text-sm max-w-md border-l-4 ${getWinnerColor('pgvector', result.evaluation.winner)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FlaskConical className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-gray-900">pgvector</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getScoreBadgeColor(result.evaluation.pgvector_score)}`}>
                          {result.evaluation.pgvector_score}%
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{result.pgvector.answer}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{result.pgvector.retrieval_time_ms.toFixed(1)}ms</span>
                      </div>
                    </td>

                    {/* Elasticsearch Answer Column */}
                    <td className={`px-6 py-4 text-sm max-w-md border-l-4 ${getWinnerColor('elasticsearch', result.evaluation.winner)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-teal-600" />
                          <span className="font-semibold text-gray-900">Elasticsearch</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getScoreBadgeColor(result.evaluation.elasticsearch_score)}`}>
                          {result.evaluation.elasticsearch_score}%
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{result.elasticsearch.answer}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{result.elasticsearch.retrieval_time_ms.toFixed(1)}ms</span>
                      </div>
                    </td>

                    {/* Evaluation Column */}
                    <td className="px-6 py-4 text-sm max-w-xs">
                      <div className="space-y-2">
                        {result.evaluation.winner === 'pgvector' && (
                          <div className="flex items-center space-x-2 text-purple-700">
                            <Award className="w-4 h-4" />
                            <span className="font-semibold">pgvector wins</span>
                          </div>
                        )}
                        {result.evaluation.winner === 'elasticsearch' && (
                          <div className="flex items-center space-x-2 text-teal-700">
                            <Award className="w-4 h-4" />
                            <span className="font-semibold">Elasticsearch wins</span>
                          </div>
                        )}
                        {result.evaluation.winner === 'tie' && (
                          <div className="flex items-center space-x-2 text-gray-700">
                            <Award className="w-4 h-4" />
                            <span className="font-semibold">Tie</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-600">{result.evaluation.reasoning}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Yet */}
      {results.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ready to Compare
          </h3>
          <p className="text-gray-600 mb-4">
            Ask a question about your CV data and compare the answers from both vector databases.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg inline-block">
            <p className="text-sm text-gray-700">
              <strong>Example Questions:</strong>
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 text-left">
              <li>• How long did Michael work at Cognizant?</li>
              <li>• What experience does Michael have with Vector Databases?</li>
              <li>• What are Michael's main competencies?</li>
              <li>• What role did Michael have at IBM?</li>
            </ul>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">How Does the Comparison Work?</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* pgvector Column */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-5 border border-purple-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-600 p-2 rounded-lg">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">pgvector (PostgreSQL)</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Pure Vector Search</p>
                  <p className="text-xs text-gray-600">Semantic similarity using embeddings</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">PostgreSQL Native</p>
                  <p className="text-xs text-gray-600">ACID transactions & SQL integration</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Fast k-NN Search</p>
                  <p className="text-xs text-gray-600">Optimized nearest-neighbor retrieval</p>
                </div>
              </div>
            </div>
          </div>

          {/* Elasticsearch Column */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-5 border border-orange-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Elasticsearch</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Hybrid Search</p>
                  <p className="text-xs text-gray-600">BM25 keyword + kNN vector (70/30 weighted)</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Advanced Text Processing</p>
                  <p className="text-xs text-gray-600">Fuzzy matching, synonyms, field boosting</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Enterprise Scale</p>
                  <p className="text-xs text-gray-600">Production-ready with horizontal scaling</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>LLM Evaluation:</strong> The selected LLM ({selectedLLM === 'local' ? currentModel : 'Grok'})
            objectively evaluates both answers based on accuracy, completeness, and clarity. The better answer
            is highlighted in green, the worse one in red.
          </p>
        </div>
      </div>
    </div>
  );
}
