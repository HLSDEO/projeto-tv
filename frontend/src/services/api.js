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

let activeRequests = 0;

const updateLoadingState = (loading) => {
  window.dispatchEvent(new CustomEvent('global-api-loading', { detail: loading }));
};

const api = axios.create({
  baseURL: normalizedBaseURL || '/',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  activeRequests++;
  if (activeRequests === 1) {
    updateLoadingState(true);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      updateLoadingState(false);
    }
    return response;
  },
  (error) => {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      updateLoadingState(false);
    }
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('must_change_password');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api; 
