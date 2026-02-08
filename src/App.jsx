import React, { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
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
    // Check Supabase session
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('✓ [APP] Supabase session найдена:', session.user.email)
          setUser({
            id: session.user.id,
            email: session.user.email,
            username: session.user.user_metadata?.username || '',
            avatar: session.user.user_metadata?.avatar || null,
            avatarColor: session.user.user_metadata?.avatarColor || '#667eea'
          })
        } else {
          // Fallback to localStorage for development
          const stored = localStorage.getItem('qs_user')
          if (stored) {
            console.log('[APP] Fallback: загружаю из localStorage')
            setUser(JSON.parse(stored))
          }
        }
      } catch (err) {
        console.error('[APP] Ошибка проверки session:', err)
      } finally {
        setLoading(false)
      }
    }

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH] Event:', event)
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || '',
          avatar: session.user.user_metadata?.avatar || null,
          avatarColor: session.user.user_metadata?.avatarColor || '#667eea'
        })
      } else {
        setUser(null)
      }
    })

    initAuth()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Make debug function available globally
    window.openDebug = () => {
      localStorage.setItem('qs_debug', 'true')
      window.location.reload()
    }
    console.log('💡 Чтобы открыть DEBUG панель, введи: window.openDebug()')
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
    supabase.auth.signOut()
    setUser(null)
    localStorage.removeItem('qs_user')
  }

  const handleUpdateUser = (updatedUserData) => {
    const updated = { ...user, ...updatedUserData }
    setUser(updated)
    localStorage.setItem('qs_user', JSON.stringify(updated))
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
        <MainApp user={user} onLogout={handleLogout} theme={theme} onThemeChange={handleThemeChange} onUpdateUser={handleUpdateUser} />
      )}
    </div>
  )
}
