import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppLayout } from './components/AppLayout'
import { Home } from './pages/Home'
import { History } from './pages/History'
import { Settings } from './pages/Settings'

const Summary = lazy(() => import('./pages/Summary').then(module => ({ default: module.Summary })))

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/history"  element={<History />} />
            <Route path="/summary"  element={
              <Suspense fallback={<SummaryFallback />}>
                <Summary />
              </Suspense>
            } />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AppProvider>
  )
}

function SummaryFallback() {
  return (
    <div className="page-shell" role="status" aria-label="Memuat ringkasan">
      <div className="h-8 w-36 rounded-lg bg-blue-100 dark:bg-[#242424]" />
    </div>
  )
}
