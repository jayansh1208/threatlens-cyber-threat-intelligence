import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
});

export const fetchDashboardStats = async () => api.get('/api/stats');
export const fetchThreats = async (params: Record<string, string | number | undefined> = {}) =>
  api.get('/api/threats', { params });
export const fetchThreat = async (id: string) => api.get(`/api/threats/${id}`);
export const searchThreats = async (q: string) => api.get('/api/search', { params: { q } });
export const fetchAnalytics = async () => api.get('/api/analytics/overview');
export const fetchSources = async () => api.get('/api/sources');
export const importSources = async () => api.post('/api/sources/import');
export const classifyReport = async (payload: Record<string, unknown>) => api.post('/api/classify', payload);
export const updateThreatClassification = async (reportId: string, payload: Record<string, unknown>) =>
  api.put(`/api/threats/${reportId}/classification`, payload);
export const fetchDatabaseStats = async () => api.get('/api/database/stats');
export const fetchDatabaseCache = async () => api.get('/api/database/cache');
export const fetchHealth = async () => api.get('/api/health');

export default api;
