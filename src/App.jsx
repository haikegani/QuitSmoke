import React, { useState, useEffect } from 'react'
import Auth from './components/Auth'
import MainApp from './components/MainApp'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('qs_theme') || 'auto'
  })

  useEffect(() => {
    // Delay to ensure styles are loaded
    setTimeout(() => {
      const stored = localStorage.getItem('qs_user')
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse stored user:', e)
        }
      }
      setLoading(false)
    }, 100)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.body.classList.toggle('dark-theme', prefersDark)
    } else {
      document.body.classList.toggle('dark-theme', theme === 'dark')
    }
  }, [theme])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('qs_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('qs_user')
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('qs_theme', newTheme)
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#fff', color: '#000' }}>
      <div style={{ fontSize: '18px' }}>Загрузка...</div>
    </div>
  }

  return (
    <div className="app-container">
      {!user ? (
        <Auth onLogin={handleLogin} theme={theme} onThemeChange={handleThemeChange} />
      ) : (
        <MainApp user={user} onLogout={handleLogout} theme={theme} onThemeChange={handleThemeChange} />
      )}
    </div>
  )
}
