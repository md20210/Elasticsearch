import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Target, Clock, Trash2 } from 'lucide-react';

const API_BASE = 'https://general-backend-production-a734.up.railway.app';

interface AnalyticsData {
  total_queries: number;
  avg_pgvector_score: number;
  avg_elasticsearch_score: number;
  avg_pgvector_latency: number;
  avg_elasticsearch_latency: number;
  winner_distribution: Array<{ key: string; count: number }>;
  score_trends: Array<{ timestamp: string; pgvector_score: number; elasticsearch_score: number }>;
  recent_queries: Array<{
    query: string;
    timestamp: string;
    winner: string;
    pgvector_score: number;
    elasticsearch_score: number;
    pgvector_latency: number;
    elasticsearch_latency: number;
    llm_provider: string;
  }>;
}

const COLORS = {
  pgvector: '#22c55e', // green-500 - bright green for winner
  elasticsearch: '#eab308', // yellow-500 - bright yellow for winner
  tie: '#6b7280' // gray
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/elasticsearch/rag-analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const clearAnalytics = async () => {
    if (!confirm('Are you sure you want to delete all analytics data? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_BASE}/elasticsearch/clear-analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh data after clearing
      await fetchAnalytics();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to clear analytics');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data || data.total_queries === 0) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-800">
          <h3 className="font-bold text-lg mb-2">No Data Available</h3>
          <p>Run some comparison queries first to see analytics!</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const scoreComparisonData = [
    { name: 'Average Score', pgvector: data.avg_pgvector_score, elasticsearch: data.avg_elasticsearch_score }
  ];

  const latencyComparisonData = [
    { name: 'Avg Latency (ms)', pgvector: data.avg_pgvector_latency, elasticsearch: data.avg_elasticsearch_latency }
  ];

  const winnerPieData = data.winner_distribution.map(item => ({
    name: item.key,
    value: item.count
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">RAG Comparison Analytics</h1>
            <p className="text-gray-600">Real-time performance metrics for pgvector vs Elasticsearch</p>
          </div>
          <button
            onClick={clearAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Queries</h3>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.total_queries}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">pgvector Score</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{data.avg_pgvector_score.toFixed(2)}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Elasticsearch Score</h3>
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{data.avg_elasticsearch_score.toFixed(2)}%</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Avg Latency</h3>
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {((data.avg_pgvector_latency + data.avg_elasticsearch_latency) / 2).toFixed(0)}ms
            </p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Average Scores Bar Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Average Scores Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pgvector" fill={COLORS.pgvector} name="pgvector" />
                <Bar dataKey="elasticsearch" fill={COLORS.elasticsearch} name="Elasticsearch" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Win Rate Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Win Rate Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winnerPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {winnerPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Latency Comparison */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Latency Comparison (ms)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={latencyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pgvector" fill={COLORS.pgvector} name="pgvector" />
                <Bar dataKey="elasticsearch" fill={COLORS.elasticsearch} name="Elasticsearch" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-4 text-center">
              {data.avg_elasticsearch_latency < data.avg_pgvector_latency
                ? `⚡ Elasticsearch is ${(data.avg_pgvector_latency - data.avg_elasticsearch_latency).toFixed(2)}ms faster`
                : `⚡ pgvector is ${(data.avg_elasticsearch_latency - data.avg_pgvector_latency).toFixed(2)}ms faster`}
            </p>
          </div>

          {/* Score Trends (placeholder if no trend data) */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Score Trends Over Time</h2>
            {data.score_trends && data.score_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.score_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pgvector_score" stroke={COLORS.pgvector} name="pgvector" />
                  <Line type="monotone" dataKey="elasticsearch_score" stroke={COLORS.elasticsearch} name="Elasticsearch" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <p>Not enough data for trends yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Queries Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Queries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pgvector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Elasticsearch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recent_queries.map((query, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{query.query}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        query.winner === 'pgvector' ? 'bg-green-100 text-green-800' :
                        query.winner === 'elasticsearch' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {query.winner}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.pgvector_score}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.elasticsearch_score}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {query.pgvector_latency.toFixed(2)}ms / {query.elasticsearch_latency.toFixed(2)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
