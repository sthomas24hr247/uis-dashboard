
// Auto cache-busting — bump APP_VERSION on every deploy
const APP_VERSION = '2026.03.24.2';
try {
  if (localStorage.getItem('uis_app_version') !== APP_VERSION) {
    // Never wipe auth keys — only wipe CSV/batch/narrative cache
    Object.keys(localStorage).filter(k =>
      (k.startsWith('uis_') || k.includes('batch') || k.includes('narrative')) &&
      k !== 'uis_token' && k !== 'uis_user' && k !== 'uis_theme'
    ).forEach(k => localStorage.removeItem(k));
    localStorage.setItem('uis_app_version', APP_VERSION);
    console.info('[UIS] Cache cleared for version', APP_VERSION);
  }
} catch {}
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { apolloClient } from './services/apollo'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ApolloProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
