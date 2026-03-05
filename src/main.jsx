/**
 * ═══════════════════════════════════════════════════════════
 *  Application Entry Point
 * ═══════════════════════════════════════════════════════════
 *
 *  Auth is now handled by the Zustand `useAuthStore` — no
 *  AuthProvider wrapper is needed. The store is global and
 *  initializes its Firebase auth listener inside App.jsx.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './components/App.jsx'
import { PreferencesProvider } from './contexts/PreferencesContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </ErrorBoundary>
  </StrictMode>,
)
