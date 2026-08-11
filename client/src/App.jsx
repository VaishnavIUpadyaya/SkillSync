import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import InteractiveBackground from './components/InteractiveBackground'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Matches = lazy(() => import('./pages/Matches'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const Analytics = lazy(() => import('./pages/Analytics'))
const VerifySkill = lazy(() => import('./pages/VerifySkill'))
const Roadmap = lazy(() => import('./pages/Roadmap'))
const UserSearch = lazy(() => import('./pages/UserSearch'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '80px', color: 'var(--text3)' }}>Loading...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 17, 26, 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            fontSize: '14px',
            backdropFilter: 'blur(12px)',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0f172a' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
        }}
      />
      <InteractiveBackground />
      <Navbar />
      <main style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(16px, 3vw, 32px)',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1,
      }}>
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', marginTop: '80px', color: 'var(--text3)' }}>Loading page...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/Home" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
            <Route path="/projects/:id/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
            <Route path="/users/:id" element={<PrivateRoute><PublicProfile /></PrivateRoute>} />
            <Route path="/projects/:id/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/verify-skill" element={<PrivateRoute><VerifySkill /></PrivateRoute>} />
            <Route path="/projects/:id/roadmap" element={<PrivateRoute><Roadmap /></PrivateRoute>} />
            <Route path="/users/search" element={<PrivateRoute><UserSearch /></PrivateRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  )
}