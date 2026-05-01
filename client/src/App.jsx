import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Matches from './pages/Matches'
import PublicProfile from './pages/PublicProfile'
import Analytics from './pages/Analytics'
import VerifySkill from './pages/VerifySkill'
import Roadmap from './pages/Roadmap'
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center mt-20 text-gray-500">Loading...</div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
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
        </Routes>
      </div>
    </BrowserRouter>
  )
}