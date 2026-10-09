import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Lightweight in-memory GET cache & in-flight request deduplication
const responseCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL_MS = 15 * 1000; // 15 seconds TTL for instant tab switching

const buildCacheKey = (url, params) => {
  if (!params || Object.keys(params).length === 0) return url;
  const sortedParams = Object.keys(params)
    .sort()
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');
  return sortedParams ? `${url}?${sortedParams}` : url;
};

export const clearApiCache = () => {
  responseCache.clear();
  inflightRequests.clear();
};

// Request Interceptor: Attach JWT Token & Invalidate Cache on Mutations
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('yims_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'delete', 'patch'].includes(method)) {
      clearApiCache();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearApiCache();
      // Clear token if expired
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('yims_token');
        localStorage.removeItem('yims_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Wrap api.get with fast TTL cache and in-flight deduplication
const originalGet = api.get.bind(api);
api.get = (url, config = {}) => {
  // Skip caching for auth endpoints or when explicitly bypassed
  if (config.skipCache || url.startsWith('/auth')) {
    return originalGet(url, config);
  }

  const key = buildCacheKey(url, config.params);
  const now = Date.now();

  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.response);
  }

  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const reqPromise = originalGet(url, config)
    .then((response) => {
      responseCache.set(key, {
        response,
        expiresAt: Date.now() + CACHE_TTL_MS
      });
      inflightRequests.delete(key);
      return response;
    })
    .catch((err) => {
      inflightRequests.delete(key);
      throw err;
    });

  inflightRequests.set(key, reqPromise);
  return reqPromise;
};

export default api;
