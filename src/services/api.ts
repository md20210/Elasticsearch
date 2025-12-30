import axios from 'axios';
import type { AnalysisRequest, AnalysisResult } from '../types';

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

export const elasticsearchApi = {
  // Analyze job (placeholder - will be implemented later)
  analyzeJob: async (data: AnalysisRequest, provider: string = 'grok'): Promise<AnalysisResult> => {
    // TODO: Implement actual API call
    console.log('Analyzing job with data:', data, 'provider:', provider);
    throw new Error('Not implemented yet');
  },

  // Parse URL (placeholder)
  parseUrl: async (url: string): Promise<{ text: string }> => {
    const response = await api.post<{ text: string }>('/parse-url', { url });
    return response.data;
  },
};

export default api;
