import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './appInsights.js'
import App from './App.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { reportarErro } from './reportarErro.js'

const Marketplace = lazy(() => import('./marketplace.jsx'))

// Cobre o que NENHUM Error Boundary React alcança: erro em handler de
// evento, setTimeout, promise rejeitada sem .catch (limitação conhecida
// do React — boundary só pega erro durante render/lifecycle da árvore).
window.addEventListener('error', (e) => reportarErro(e.message, e.error?.stack))
window.addEventListener('unhandledrejection', (e) =>
  reportarErro(`Promise rejeitada sem catch: ${e.reason?.message ?? e.reason}`, e.reason?.stack)
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/marketplace"
            element={
              <Suspense fallback={null}>
                <Marketplace />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)