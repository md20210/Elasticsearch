// User Profile Request
export interface UserProfileRequest {
  cv_text: string;
  cover_letter_text?: string;
  homepage_url?: string;
  linkedin_url?: string;
}

// Analysis Request
export interface AnalysisRequest {
  cv_text?: string;
  cover_letter_text?: string;
  homepage_url?: string;
  linkedin_url?: string;
  job_description?: string;
  job_url?: string;
  provider?: string;
}

// Analysis Results
export interface AnalysisResult {
  id?: number;
  user_id?: string;
  job_description: string;
  job_url?: string;
  job_analysis: JobAnalysis;
  fit_score: FitScore;
  success_probability: SuccessProbability;
  created_at?: string;
  chromadb_search_time_ms: number;
  chromadb_matches_count: number;
  elasticsearch_search_time_ms: number;
  elasticsearch_matches_count: number;
  performance_comparison: {
    faster_system: string;
    time_saved_ms: number;
    speedup_factor: number;
    chromadb_time_ms: number;
    elasticsearch_time_ms: number;
    percentage_difference: number;
  };
}

export interface JobAnalysis {
  company: string;
  role: string;
  location: string;
  remote_policy: string;
  seniority: string;
  salary_range: {
    min: number | null;
    max: number | null;
    currency: string;
  };
  requirements: Requirements;
  responsibilities: string[];
  keywords: string[];
  red_flags: string[];
  green_flags: string[];
}

export interface Requirements {
  must_have: string[];
  nice_to_have: string[];
  years_experience: { min: number; max: number | null };
  education: string;
  languages: string[];
  certifications: string[];
}

export interface FitScore {
  total: number;
  breakdown: FitScoreBreakdown;
  matched_skills: string[];
  missing_skills: string[];
}

export interface FitScoreBreakdown {
  experience_match: number;
  skills_match: number;
  education_match: number;
  location_match: number;
  salary_match: number;
  culture_match: number;
  role_type_match: number;
}

export interface SuccessProbability {
  probability: number;
  factors: ProbabilityFactor[];
  recommendation: string;
}

export interface ProbabilityFactor {
  factor: string;
  impact: number;
}
