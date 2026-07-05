import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AIComplianceChat from './pages/AIComplianceChat'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'
import PermissionsPage from './pages/PermissionsPage'
import AdminPanel from './pages/AdminPanel'
import LoadingScreen from './components/LoadingScreen'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'

const AuthRedirect = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && (
          <LoadingScreen onLoadingComplete={() => setLoading(false)} />
        )}
      </AnimatePresence>

      {!loading && (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthRedirect><AuthPage initialMode="login" /></AuthRedirect>} />
          <Route path="/signup" element={<AuthRedirect><AuthPage initialMode="signup" /></AuthRedirect>} />
          <Route path="/dashboard" element={
            <ProtectedRoute requireAdmin>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/ai-compliance" element={
            <ProtectedRoute requireAnyPermission={['participate_in_assessment', 'start_assessment', 'view_own_sessions']}>
              <AIComplianceChat />
            </ProtectedRoute>
          } />
          <Route path="/permissions" element={
            <ProtectedRoute requireAnyPermission={['manage_permissions', 'grant_permissions']}>
              <PermissionsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App
