import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

const getFallbackApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://campusconnect-864s.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || getFallbackApiUrl();
const baseHost = apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl;
axios.defaults.baseURL = baseHost;
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
