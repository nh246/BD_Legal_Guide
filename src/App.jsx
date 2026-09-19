import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'

// Placeholders for other pages
const ChatPage = () => <div className="p-8 text-white">Chat Page coming soon...</div>
const PricingPage = () => <div className="p-8 text-white">Pricing Page coming soon...</div>

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
