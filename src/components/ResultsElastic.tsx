import { useState, useEffect } from 'react';
import { elasticsearchApi } from '../services/api';
import type { AnalysisResult } from '../types';
import {
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Filter,
  TrendingUp,
  Activity,
  Database,
  Check,
  X,
  Loader,
  BarChart3,
  Zap,
  GitBranch,
  Layers,
} from 'lucide-react';

// Elastic Logo SVG (official colors #FED10A yellow, #00BFB3 teal)
const ElasticLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 inline-block mr-2">
    <circle cx="16" cy="16" r="16" fill="#FED10A" />
    <path
      d="M20 8H12c-2.2 0-4 1.8-4 4v8c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4v-8c0-2.2-1.8-4-4-4z"
      fill="#00BFB3"
    />
    <circle cx="16" cy="16" r="4" fill="#FED10A" />
  </svg>
);

interface ResultsElasticProps {
  results: AnalysisResult | null;
}

interface LogstashParsed {
  parsed_skills: string[];
  experience_years: number | null;
  education_level: string;
  job_titles: string[];
  pipeline_execution_time_ms: number;
}

export default function ResultsElastic({ results: propResults }: ResultsElasticProps) {
  const [results, setResults] = useState<AnalysisResult | null>(propResults);
  const [logstashCV, setLogstashCV] = useState<LogstashParsed | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load latest analysis if no results provided
  useEffect(() => {
    const loadLatest = async () => {
      if (!propResults) {
        try {
          const latest = await elasticsearchApi.getLatestAnalysis();
          if (latest) {
            setResults(latest);
          }
        } catch (err) {
          console.error('Failed to load latest analysis:', err);
        } finally {
          setInitialLoading(false);
        }
      } else {
        setResults(propResults);
        setInitialLoading(false);
      }
    };
    loadLatest();
  }, [propResults]);

  useEffect(() => {
    if (results) {
      loadLogstashData();
    }
  }, [results]);

  const loadLogstashData = async () => {
    if (!results) return;

    try {
      setLoading(true);

      // Parse CV with Logstash
      const cvParsed = await elasticsearchApi.parseCV(results.job_description);
      setLogstashCV(cvParsed);
    } catch (err) {
      console.error('Error parsing with Logstash:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <Loader className="w-12 h-12 text-[#00BFB3] mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading Elastic Stack analysis...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analysis Yet</h3>
        <p className="text-gray-500">
          Analyze a job posting on the "Analyze Job" tab first
        </p>
      </div>
    );
  }

  // Prepare data for Elasticsearch visualizations
  const fitScoreBreakdown = [
    { category: 'Experience', score: results.fit_score.breakdown.experience_match, fill: '#00BFB3' },
    { category: 'Skills', score: results.fit_score.breakdown.skills_match, fill: '#FED10A' },
    { category: 'Education', score: results.fit_score.breakdown.education_match, fill: '#F04E98' },
    { category: 'Location', score: results.fit_score.breakdown.location_match, fill: '#1BA9F5' },
    { category: 'Culture', score: results.fit_score.breakdown.culture_match, fill: '#93C90E' },
    { category: 'Role Type', score: results.fit_score.breakdown.role_type_match, fill: '#FEC514' },
  ];

  const radarData = fitScoreBreakdown.map(item => ({
    subject: item.category,
    score: item.score,
    fullMark: 100,
  }));

  const performanceMetrics = [
    {
      name: 'ChromaDB',
      time: results.chromadb_search_time_ms || 0,
      matches: results.chromadb_matches_count || 0,
      fill: '#94A3B8',
    },
    {
      name: 'Elasticsearch',
      time: results.elasticsearch_search_time_ms || 0,
      matches: results.elasticsearch_matches_count || 0,
      fill: '#00BFB3',
    },
  ];

  const speedupFactor = results.performance_comparison?.speedup_factor || 1;

  const skillsMatched = (results.fit_score.matched_skills || []).slice(0, 10);
  const skillsMissing = (results.fit_score.missing_skills || []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00BFB3] to-[#FED10A] rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <ElasticLogo />
              <h2 className="text-3xl font-bold">Elastic Stack Analysis</h2>
            </div>
            <p className="text-white/90">
              Powered by Elasticsearch, Logstash, and Kibana
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{results.fit_score.total}%</div>
            <div className="text-white/90">Overall Fit Score</div>
          </div>
        </div>
      </div>

      {/* === SECTION 1: ELASTICSEARCH === */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center mb-6">
          <Search className="w-6 h-6 text-[#00BFB3] mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">
            1. Elasticsearch - Advanced Search & Aggregations
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Comparison */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-[#FED10A]" />
              Search Performance (ms)
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="time" name="Search Time (ms)">
                  {performanceMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Speedup: <span className="font-bold text-[#00BFB3]">
                  {speedupFactor.toFixed(1)}x faster
                </span>
              </p>
            </div>
          </div>

          {/* Elasticsearch Features Used */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-[#00BFB3]" />
              Elasticsearch Features Used
            </h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Full-Text Search</span>
                  <p className="text-sm text-gray-600">BM25 relevance scoring with field boosting</p>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Fuzzy Matching</span>
                  <p className="text-sm text-gray-600">Typo tolerance with edit distance</p>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Aggregations</span>
                  <p className="text-sm text-gray-600">Skills, experience, education buckets</p>
                </div>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Multi-field Queries</span>
                  <p className="text-sm text-gray-600">Search across skills, experience, education</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Skills Match Analysis */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <Check className="w-5 h-5 mr-2" />
              Matched Skills ({skillsMatched.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {skillsMatched.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {skillsMissing.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                <X className="w-5 h-5 mr-2" />
                Missing Skills ({skillsMissing.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {skillsMissing.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === SECTION 2: LOGSTASH === */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center mb-6">
          <Filter className="w-6 h-6 text-[#FED10A] mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">
            2. Logstash - Data Processing Pipeline
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 text-[#FED10A] mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Processing with Logstash pipelines...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logstash Pipeline Flow */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                <GitBranch className="w-5 h-5 mr-2 text-[#FED10A]" />
                Pipeline Flow
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Input: Raw CV/Job Text</p>
                    <p className="text-sm text-gray-600">Receive unstructured data</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-[#FED10A] rounded-full flex items-center justify-center text-gray-900 font-bold text-sm mr-3">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Filter: Grok Patterns</p>
                    <p className="text-sm text-gray-600">Extract skills, experience, education</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Output: Structured Data</p>
                    <p className="text-sm text-gray-600">Send to Elasticsearch</p>
                  </div>
                </div>
              </div>
              {logstashCV && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Pipeline execution: <span className="font-bold text-[#FED10A]">
                      {(logstashCV.pipeline_execution_time_ms || 0).toFixed(2)}ms
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Extracted Data */}
            {logstashCV && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-[#FED10A]" />
                  Extracted Data Points
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Skills Extracted</p>
                    <p className="font-bold text-lg text-gray-900">
                      {(logstashCV.parsed_skills || []).length} skills
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(logstashCV.parsed_skills || []).slice(0, 8).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#FED10A]/20 text-gray-800 rounded text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-bold text-gray-900">
                        {logstashCV.experience_years || 'N/A'} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Education</p>
                      <p className="font-bold text-gray-900">
                        {logstashCV.education_level}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Job Titles</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(logstashCV.job_titles || []).map((title, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                        >
                          {title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logstash Features */}
        <div className="mt-6 bg-gradient-to-r from-[#FED10A]/10 to-[#FED10A]/5 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Logstash Capabilities Demonstrated</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#FED10A] mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Grok Patterns</p>
                <p className="text-sm text-gray-600">Pattern matching for unstructured text</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#FED10A] mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Field Enrichment</p>
                <p className="text-sm text-gray-600">Add metadata and transform data</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[#FED10A] mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Pipeline Filters</p>
                <p className="text-sm text-gray-600">Multi-stage data transformation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION 3: KIBANA === */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center mb-6">
          <BarChart3 className="w-6 h-6 text-[#F04E98] mr-3" />
          <h3 className="text-2xl font-bold text-gray-900">
            3. Kibana - Data Visualization & Dashboards
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart - Multi-dimensional Analysis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[#F04E98]" />
              Multi-Dimensional Fit Analysis
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#00BFB3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#374151', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Fit Score"
                  dataKey="score"
                  stroke="#00BFB3"
                  fill="#00BFB3"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Fit Score Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-[#F04E98]" />
              Fit Score Components
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={fitScoreBreakdown} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="category" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="score" name="Score">
                  {fitScoreBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success Probability */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            Success Probability Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {results.success_probability.probability}%
              </div>
              <p className="text-gray-700 font-medium">Success Probability</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-medium text-gray-800 mb-2">Key Factors:</p>
              <div className="space-y-2">
                {(results.success_probability.factors || []).map((factor, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white rounded px-3 py-2">
                    <span className="text-sm text-gray-700">{factor.factor}</span>
                    <span className={`font-bold ${
                      factor.impact > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {factor.impact > 0 ? '+' : ''}{factor.impact}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-800">Recommendation:</p>
            <p className="text-gray-700">{results.success_probability.recommendation}</p>
          </div>
        </div>

        {/* Kibana Features */}
        <div className="mt-6 bg-gradient-to-r from-[#F04E98]/10 to-[#F04E98]/5 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Kibana Visualization Types Used</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-[#F04E98] mx-auto mb-2" />
              <p className="font-medium">Bar Charts</p>
              <p className="text-xs text-gray-600">Component breakdown</p>
            </div>
            <div className="text-center">
              <Activity className="w-8 h-8 text-[#F04E98] mx-auto mb-2" />
              <p className="font-medium">Radar Charts</p>
              <p className="text-xs text-gray-600">Multi-dimensional</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-[#F04E98] mx-auto mb-2" />
              <p className="font-medium">Metrics</p>
              <p className="text-xs text-gray-600">KPIs & scores</p>
            </div>
            <div className="text-center">
              <Database className="w-8 h-8 text-[#F04E98] mx-auto mb-2" />
              <p className="font-medium">Data Tables</p>
              <p className="text-xs text-gray-600">Detailed views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job Analysis Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Job Analysis Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Company</p>
            <p className="font-bold text-gray-900">{results.job_analysis.company}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Role</p>
            <p className="font-bold text-gray-900">{results.job_analysis.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-bold text-gray-900">{results.job_analysis.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Seniority</p>
            <p className="font-bold text-gray-900">{results.job_analysis.seniority}</p>
          </div>
        </div>

        {/* Red & Green Flags */}
        {((results.job_analysis.red_flags || []).length > 0 || (results.job_analysis.green_flags || []).length > 0) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(results.job_analysis.green_flags || []).length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  Green Flags
                </h4>
                <ul className="space-y-1">
                  {(results.job_analysis.green_flags || []).map((flag, idx) => (
                    <li key={idx} className="text-sm text-green-700">• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
            {(results.job_analysis.red_flags || []).length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                  <X className="w-5 h-5 mr-2" />
                  Red Flags
                </h4>
                <ul className="space-y-1">
                  {(results.job_analysis.red_flags || []).map((flag, idx) => (
                    <li key={idx} className="text-sm text-red-700">• {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
