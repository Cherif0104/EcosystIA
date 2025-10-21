
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContextSupabase';
import { LocalizationProvider } from './contexts/LocalizationContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <LocalizationProvider>
        <App />
      </LocalizationProvider>
    </AuthProvider>
  </React.StrictMode>
);