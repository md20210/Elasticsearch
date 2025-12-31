import axios from 'axios';
import type { AnalysisRequest, AnalysisResult, UserProfileRequest } from '../types';

const API_BASE_URL = 'https://general-backend-production-a734.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get or refresh demo token
export const getDemoToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/demo/token`);
    const token = response.data.access_token;
    localStorage.setItem('auth_token', token);
    console.log('Demo token obtained and stored');
    return token;
  } catch (error) {
    console.error('Failed to get demo token:', error);
    throw error;
  }
};

// Initialize authentication on app load
export const initAuth = async (): Promise<void> => {
  // Always refresh token to ensure it's valid
  try {
    await getDemoToken();
  } catch (error) {
    console.error('Failed to initialize authentication:', error);
  }
};

export const elasticsearchApi = {
  // Create or update user profile
  createProfile: async (profileData: UserProfileRequest, provider: string = 'grok') => {
    const response = await api.post(`/elasticsearch/profile?provider=${provider}`, profileData);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/elasticsearch/profile');
    return response.data;
  },

  // Analyze job and compare ChromaDB vs Elasticsearch
  analyzeJob: async (data: AnalysisRequest, provider: string = 'grok'): Promise<AnalysisResult> => {
    // First, create/update profile with CV data if provided
    if (data.cv_text || data.cover_letter_text || data.homepage_url || data.linkedin_url) {
      try {
        await elasticsearchApi.createProfile({
          cv_text: data.cv_text || '',
          cover_letter_text: data.cover_letter_text,
          homepage_url: data.homepage_url,
          linkedin_url: data.linkedin_url,
        }, provider);
        console.log('Profile created/updated successfully');
      } catch (error) {
        console.error('Failed to create/update profile:', error);
        throw new Error('Failed to save your CV/profile. Please try again.');
      }
    }

    // Now analyze the job
    try {
      const response = await api.post<AnalysisResult>('/elasticsearch/analyze', {
        job_description: data.job_description,
        job_url: data.job_url,
        required_skills: [], // Can be extracted from job description later
        provider: provider,
      });
      return response.data;
    } catch (error: any) {
      console.error('Job analysis failed:', error);
      if (error.response?.status === 404) {
        throw new Error('Please upload your CV first before analyzing jobs.');
      }
      throw new Error(error.response?.data?.detail || 'Job analysis failed. Please try again.');
    }
  },

  // Get latest analysis results
  getLatestAnalysis: async (): Promise<AnalysisResult | null> => {
    try {
      const response = await api.get<AnalysisResult[]>('/elasticsearch/comparisons?limit=1');
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Failed to load latest analysis:', error);
      return null;
    }
  },

  // Parse URL (placeholder)
  parseUrl: async (url: string): Promise<{ text: string }> => {
    const response = await api.post<{ text: string }>('/parse-url', { url });
    return response.data;
  },

  // ===== Elasticsearch Advanced Features =====

  // Get features overview
  getFeaturesOverview: async () => {
    const response = await api.get('/elasticsearch/advanced/features-overview');
    return response.data;
  },

  // Get advanced aggregations
  getAggregations: async () => {
    const response = await api.get('/elasticsearch/advanced/aggregations');
    return response.data;
  },

  // Phrase search
  phraseSearch: async (phrase: string, slop: number = 2) => {
    const response = await api.post('/elasticsearch/advanced/phrase-search', null, {
      params: { phrase, slop }
    });
    return response.data;
  },

  // Wildcard search
  wildcardSearch: async (pattern: string, field: string = 'skills') => {
    const response = await api.post('/elasticsearch/advanced/wildcard-search', null, {
      params: { pattern, field }
    });
    return response.data;
  },

  // ===== Logstash Integration =====

  // Parse CV with Logstash
  parseCV: async (cvText: string) => {
    const response = await api.post('/elasticsearch/logstash/parse-cv', null, {
      params: { cv_text: cvText }
    });
    // API returns {status, data, logstash_deployed}, extract data
    const result = response.data.data || response.data;
    return {
      parsed_skills: result.skills_extracted || [],
      experience_years: result.experience_years,
      education_level: result.education_level || 'Not specified',
      job_titles: result.job_titles || [],
      pipeline_execution_time_ms: Math.random() * 100 + 50 // Simulated
    };
  },

  // Parse Job with Logstash
  parseJob: async (jobDescription: string, jobId: string = 'generated') => {
    const response = await api.post('/elasticsearch/logstash/parse-job', null, {
      params: { job_description: jobDescription, job_id: jobId }
    });
    // API returns {status, data, logstash_deployed}, extract data
    const result = response.data.data || response.data;
    return {
      parsed_skills: result.skills_extracted || [],
      experience_years: result.experience_years,
      education_level: result.education_level || 'Not specified',
      job_titles: result.job_titles || [],
      pipeline_execution_time_ms: Math.random() * 100 + 50 // Simulated
    };
  },

  // Get Logstash pipeline status
  getLogstashStatus: async () => {
    const response = await api.get('/elasticsearch/logstash/pipeline-status');
    return response.data;
  },

  // Get Elastic Stack status
  getElasticStackStatus: async () => {
    const response = await api.get('/elasticsearch/elastic-stack/status');
    return response.data;
  },

  // ===== Demo Data Generator =====

  // Generate demo data
  generateDemoData: async (count: number = 100) => {
    const response = await api.post('/elasticsearch/demo/generate', null, {
      params: { count }
    });
    return response.data;
  },

  // Get demo statistics
  getDemoStats: async () => {
    const response = await api.get('/elasticsearch/demo/stats');
    return response.data;
  },

  // Clear demo data
  clearDemoData: async (keepLatest: number = 1) => {
    const response = await api.delete('/elasticsearch/demo/clear', {
      params: { keep_latest: keepLatest }
    });
    return response.data;
  },
};

export default api;
