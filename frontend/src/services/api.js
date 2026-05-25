import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_API_URL || '/';
const normalizedBaseURL = configuredBaseURL.endsWith('/')
  ? configuredBaseURL.slice(0, -1)
  : configuredBaseURL;

export const assetBaseURL = normalizedBaseURL || window.location.origin;

export const getAssetUrl = (path) => new URL(path, `${assetBaseURL}/`).toString();
export const getWebSocketUrl = (path = '/ws') => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = new URL(assetBaseURL).host;
  return `${protocol}//${host}${path}`;
};

const api = axios.create({
  baseURL: normalizedBaseURL || '/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
