// User Profile Request
export interface UserProfileRequest {
  cv_text: string;
  cover_letter_text?: string;
  homepage_url?: string;
  linkedin_url?: string;
}

// User Profile Response
export interface UserProfileResponse {
  user_id: string;
  cv_text: string;
  cover_letter_text?: string;
  homepage_url?: string;
  linkedin_url?: string;
  skills_extracted: string[];
  experience_years?: number;
  education_level?: string;
  job_titles: string[];
  created_at: string;
  updated_at: string;
  // Import status fields
  elasticsearch_indexed?: boolean;
  pgvector_chunks?: number;
  homepage_crawled?: boolean;
  linkedin_crawled?: boolean;
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
  interview_success: InterviewSuccess;
  success_probability?: SuccessProbability; // Deprecated, kept for backward compatibility
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
  component_explanations?: ComponentExplanations;
  exact_match_skills?: string[];
  strong_match_skills?: string[];
  partial_match_skills?: string[];
  missing_skills: string[];
  matched_skills?: string[]; // Deprecated, kept for backward compatibility
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

export interface ComponentExplanations {
  experience_match: string;
  skills_match: string;
  education_match: string;
  location_match: string;
  salary_match: string;
  culture_match: string;
  role_type_match: string;
}

export interface InterviewSuccess {
  probability: number;
  interpretation: string;
  factors: ProbabilityFactor[];
  recommendation: string;
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
