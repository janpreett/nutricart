import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import Layout         from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ProfileScreen  from './screens/ProfileScreen.jsx'
import PlanScreen     from './screens/PlanScreen.jsx'
import LoginScreen    from './screens/LoginScreen.jsx'
import RegisterScreen from './screens/RegisterScreen.jsx'
import TermsScreen from './screens/TermsScreen'
import PrivacyScreen from './screens/PrivacyScreen'
import ContactScreen from './screens/ContactScreen'


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* redirect root to /profile */}
            <Route path="/" element={<Navigate replace to="/profile" />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileScreen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/plan"
              element={
                <ProtectedRoute>
                  <PlanScreen />
                </ProtectedRoute>
              }
            />

            {/* public auth */}
            <Route path="/login"    element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />

            {/* Static Pages */}
            <Route path="/terms" element={<TermsScreen />} />
            <Route path="/privacy" element={<PrivacyScreen />} />
            <Route path="/contact" element={<ContactScreen />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}
