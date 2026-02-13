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
