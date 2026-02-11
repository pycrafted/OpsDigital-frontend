import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './css/style.css';
import './css/satoshi.css';
import 'jsvectormap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';

// Appliquer le thème sauvegardé (navbar toggle) dès le chargement pour éviter un flash
const savedTheme = localStorage.getItem('color-theme') as 'dark' | 'light' | null;
const isDark = savedTheme === 'dark' || (!savedTheme && false); // défaut: light
if (isDark) {
  document.documentElement.classList.add('dark');
  document.body.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
  document.body.classList.remove('dark');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
