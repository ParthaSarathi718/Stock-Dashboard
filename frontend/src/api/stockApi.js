// stockApi.js — Single source of truth for all backend API calls.
// Using axios for automatic JSON parsing, error handling, and base URL config.
// All components import from here — changing the backend URL means
// updating ONE file, not hunting through 20 components.

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || "https://stock-dashboard-o64y.onrender.com/api/v1";

// Axios instance with shared configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,           // 15 second timeout
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — centralized error handling
api.interceptors.response.use(
  (response) => response.data,   // Unwrap .data so callers get the payload directly
  (error) => {
    const message = error.response?.data?.detail || error.message || 'API Error';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

// ─── API functions ────────────────────────────────────────────────────────────

/** Fetch all tracked companies with current prices */
export const getCompanies = () => api.get('/companies');

/**
 * Fetch OHLCV + analytics for a symbol
 * @param {string} symbol - e.g. "AAPL"
 * @param {number} days   - number of trading days (default 30)
 */
export const getStock = (symbol, days = 30) =>
  api.get(`/stock/${symbol}`, { params: { days } });

/**
 * Compare multiple stocks (normalised to 100)
 * @param {string[]} symbols - array of ticker strings
 * @param {number}   days
 */
export const compareStocks = (symbols, days = 30) =>
  api.get('/compare', { params: { stocks: symbols.join(','), days } });

/**
 * Full analytics summary + ML predictions
 * @param {string} symbol
 */
export const getSummary = (symbol) => api.get(`/summary/${symbol}`);

export default api;