import { TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface ResultsChromaDBProps {
  results: AnalysisResult | null;
}

export default function ResultsChromaDB({ results }: ResultsChromaDBProps) {
  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Results Yet</h3>
        <p className="text-gray-600">
          Run an analysis from the "Analyze Job" tab to see results here
        </p>
      </div>
    );
  }

  const { job_analysis, fit_score, success_probability } = results;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Job Overview */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Overview</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Company</label>
            <p className="text-lg font-semibold text-gray-900">{job_analysis.company}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Role</label>
            <p className="text-lg font-semibold text-gray-900">{job_analysis.role}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Location</label>
            <p className="text-gray-900">{job_analysis.location}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Remote Policy</label>
            <p className="text-gray-900">{job_analysis.remote_policy}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Seniority</label>
            <p className="text-gray-900">{job_analysis.seniority}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Salary Range</label>
            <p className="text-gray-900">
              {job_analysis.salary_range.min && job_analysis.salary_range.max
                ? `${job_analysis.salary_range.currency} ${job_analysis.salary_range.min.toLocaleString()} - ${job_analysis.salary_range.max.toLocaleString()}`
                : 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Fit Score */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Fit Score</h2>
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold ${getScoreColor(fit_score.total)}`}>
            {fit_score.total}%
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="text-sm font-medium text-gray-600">Experience</label>
            <p className={`text-2xl font-bold ${getScoreColor(fit_score.breakdown.experience_match).split(' ')[0]}`}>
              {fit_score.breakdown.experience_match}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="text-sm font-medium text-gray-600">Skills</label>
            <p className={`text-2xl font-bold ${getScoreColor(fit_score.breakdown.skills_match).split(' ')[0]}`}>
              {fit_score.breakdown.skills_match}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="text-sm font-medium text-gray-600">Education</label>
            <p className={`text-2xl font-bold ${getScoreColor(fit_score.breakdown.education_match).split(' ')[0]}`}>
              {fit_score.breakdown.education_match}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="text-sm font-medium text-gray-600">Location</label>
            <p className={`text-2xl font-bold ${getScoreColor(fit_score.breakdown.location_match).split(' ')[0]}`}>
              {fit_score.breakdown.location_match}%
            </p>
          </div>
        </div>
      </div>

      {/* Success Probability */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Success Probability</h2>
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreColor(success_probability.probability)}`}>
            {success_probability.probability}%
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600 mb-2 block">Recommendation</label>
          <p className="text-gray-900 bg-blue-50 p-4 rounded-lg">{success_probability.recommendation}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">Key Factors</label>
          <div className="space-y-2">
            {success_probability.factors.map((factor, idx) => (
              <div key={idx} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                <span className={`font-semibold ${factor.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {factor.impact >= 0 ? '+' : ''}{factor.impact}%
                </span>
                <span className="text-gray-900 flex-1">{factor.factor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matched Skills */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Matched Skills ({fit_score.matched_skills.length})</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {fit_score.matched_skills.map((skill, idx) => (
            <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Missing Skills */}
      {fit_score.missing_skills.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <XCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">Missing Skills ({fit_score.missing_skills.length})</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {fit_score.missing_skills.map((skill, idx) => (
              <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Red & Green Flags */}
      <div className="grid md:grid-cols-2 gap-6">
        {job_analysis.green_flags.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Green Flags</h2>
            </div>
            <ul className="space-y-2">
              {job_analysis.green_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-900">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {job_analysis.red_flags.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Red Flags</h2>
            </div>
            <ul className="space-y-2">
              {job_analysis.red_flags.map((flag, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-900">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
