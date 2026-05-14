import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AppLayout } from './components/AppLayout'
import { Home } from './pages/Home'
import { History } from './pages/History'
import { Summary } from './pages/Summary'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/history"  element={<History />} />
            <Route path="/summary"  element={<Summary />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AppProvider>
  )
}
