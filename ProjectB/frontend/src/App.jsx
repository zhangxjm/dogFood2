import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import { authApi } from './services/api'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import HealthData from './pages/HealthData'
import Reports from './pages/Reports'
import Goals from './pages/Goals'
import Profile from './pages/Profile'

function App() {
  const { isAuthenticated, token, setUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && token) {
      authApi.getCurrentUser()
        .then((response) => {
          setUser(response.data)
        })
        .catch((error) => {
          console.error('获取用户信息失败:', error)
        })
    }
  }, [isAuthenticated, token, setUser])

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="devices" element={<Devices />} />
          <Route path="health-data" element={<HealthData />} />
          <Route path="reports" element={<Reports />} />
          <Route path="goals" element={<Goals />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
