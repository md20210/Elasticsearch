import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Database, FileText, Activity, Sparkles, Loader2 } from 'lucide-react';

interface AnalyticsData {
  total_documents: number;
  index_size_bytes: number;
  index_size_mb: number;
  avg_chunk_size: number;
  field_coverage: {
    databases: number;
    programming_languages: number;
    companies: number;
    skills: number;
    certifications: number;
  };
  top_skills: { skill: string; count: number }[];
  timeline: { company: string; mentions: number }[];
  database_distribution: { name: string; value: number }[];
  language_distribution: { name: string; value: number }[];
}

export default function AnalyticsDashboardTab() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch(
          'https://general-backend-production-a734.up.railway.app/elasticsearch/analytics',
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const handleGenerateDemoData = async (count: number = 50) => {
    setGenerating(true);
    setGenerateStatus('Generating demo profiles...');
    try {
      const response = await fetch(
        `https://general-backend-production-a734.up.railway.app/elasticsearch/demo/generate?count=${count}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGenerateStatus(`✅ Generated ${data.profiles_created} profiles!`);
        // Reload analytics after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const error = await response.json();
        setGenerateStatus(`❌ Error: ${error.detail || 'Failed to generate data'}`);
      }
    } catch (error) {
      console.error('Failed to generate demo data:', error);
      setGenerateStatus('❌ Failed to generate demo data');
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setGenerateStatus('');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <p className="text-gray-600">Failed to load analytics data.</p>
      </div>
    );
  }

  const maxSkillCount = Math.max(...analytics.top_skills.map((s) => s.count));
  const maxDbCount = Math.max(...analytics.database_distribution.map((d) => d.value));
  const maxLangCount = Math.max(...analytics.language_distribution.map((l) => l.value));

  return (
    <div className="space-y-6">
      {/* Generate Demo Data Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Need Demo Data?</h3>
            <p className="text-purple-100 text-sm">
              Generate sample profiles to see analytics in action
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleGenerateDemoData(20)}
              disabled={generating}
              className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate 20 Profiles</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleGenerateDemoData(50)}
              disabled={generating}
              className="px-6 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate 50 Profiles</span>
                </>
              )}
            </button>
          </div>
        </div>
        {generateStatus && (
          <div className="mt-4 p-3 bg-white/20 rounded-lg backdrop-blur">
            <p className="text-sm font-medium">{generateStatus}</p>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-sm text-gray-500">Documents</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{analytics.total_documents}</div>
          <p className="text-sm text-gray-600 mt-1">Total Chunks</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-8 h-8 text-purple-600" />
            <span className="text-sm text-gray-500">Index Size</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{analytics.index_size_mb}</div>
          <p className="text-sm text-gray-600 mt-1">MB</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <span className="text-sm text-gray-500">Avg Chunk</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{Math.round(analytics.avg_chunk_size)}</div>
          <p className="text-sm text-gray-600 mt-1">Characters</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-teal-600" />
            <span className="text-sm text-gray-500">Skills</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{analytics.top_skills.length}</div>
          <p className="text-sm text-gray-600 mt-1">Unique Skills</p>
        </div>
      </div>

      {/* Field Coverage */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>Field Coverage</span>
        </h3>
        <div className="space-y-4">
          {Object.entries(analytics.field_coverage).map(([field, coverage]) => (
            <div key={field}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 capitalize">{field.replace('_', ' ')}</span>
                <span className="font-semibold text-gray-900">{coverage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${coverage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Skills */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top Skills</h3>
          <div className="space-y-3">
            {analytics.top_skills.slice(0, 10).map((skill) => (
              <div key={skill.skill}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{skill.skill}</span>
                  <span className="font-semibold text-gray-900">{skill.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                    style={{ width: `${(skill.count / maxSkillCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Timeline */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Company Mentions</h3>
          <div className="space-y-3">
            {analytics.timeline.slice(0, 10).map((item) => (
              <div key={item.company}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.company}</span>
                  <span className="font-semibold text-gray-900">{item.mentions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full"
                    style={{
                      width: `${(item.mentions / Math.max(...analytics.timeline.map((t) => t.mentions))) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Database Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Database Technologies</h3>
          <div className="space-y-3">
            {analytics.database_distribution.slice(0, 10).map((db) => (
              <div key={db.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{db.name}</span>
                  <span className="font-semibold text-gray-900">{db.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full"
                    style={{ width: `${(db.value / maxDbCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Programming Languages */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Programming Languages</h3>
          <div className="space-y-3">
            {analytics.language_distribution.slice(0, 10).map((lang) => (
              <div key={lang.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{lang.name}</span>
                  <span className="font-semibold text-gray-900">{lang.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                    style={{ width: `${(lang.value / maxLangCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-bold text-blue-900 mb-2">Kibana-Style Analytics</h3>
        <p className="text-sm text-blue-800">
          This dashboard demonstrates Elasticsearch's aggregation capabilities, similar to what Kibana provides.
          All metrics are calculated in real-time from your indexed CV data using Elasticsearch aggregations.
        </p>
      </div>
    </div>
  );
}
