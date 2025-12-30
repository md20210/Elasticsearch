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
  job_analysis: JobAnalysis;
  fit_score: FitScore;
  success_probability: SuccessProbability;
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
