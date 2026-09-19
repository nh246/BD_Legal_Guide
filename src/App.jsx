import React from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

// Placeholders for other pages
const LoginPage = () => <div className="p-8 text-white">Login Page coming soon...</div>
const ChatPage = () => <div className="p-8 text-white">Chat Page coming soon...</div>
const PricingPage = () => <div className="p-8 text-white">Pricing Page coming soon...</div>

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/pricing" element={<PricingPage />} />
    </Routes>
  )
}

export default App
