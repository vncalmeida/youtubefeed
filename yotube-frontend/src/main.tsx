import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AdminAuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);
