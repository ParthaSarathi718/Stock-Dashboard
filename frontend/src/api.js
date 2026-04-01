import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Setup global Axios interceptor for JWT insertion
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth Endpoints ---
export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await axios.post(`${API_BASE_URL}/token`, formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return response.data;
};

export const registerUser = async (username, password) => {
  const response = await axios.post(`${API_BASE_URL}/register`, { username, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axios.get(`${API_BASE_URL}/users/me`);
  return response.data;
};

// --- Data Endpoints ---
export const fetchCompanies = async () => {
  const response = await axios.get(`${API_BASE_URL}/companies`);
  return response.data;
};

export const fetchStockData = async (symbol) => {
  const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
  return response.data.data;
};

export const fetchSummary = async (symbol) => {
  const response = await axios.get(`${API_BASE_URL}/summary/${symbol}`);
  return response.data;
};

// --- Watchlist Endpoints ---
export const getWatchlist = async () => {
  const response = await axios.get(`${API_BASE_URL}/watchlist`);
  return response.data;
};

export const addToWatchlist = async (symbol) => {
  const response = await axios.post(`${API_BASE_URL}/watchlist`, { symbol });
  return response.data;
};

export const removeFromWatchlist = async (symbol) => {
  const response = await axios.delete(`${API_BASE_URL}/watchlist/${symbol}`);
  return response.data;
};
