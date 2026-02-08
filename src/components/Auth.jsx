import React, { useState } from 'react'
import './Auth.css'

export default function Auth({ onLogin, theme, onThemeChange }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const getThemeLabel = () => {
    if (theme === 'auto') return 'Авто'
    if (theme === 'dark') return '◐ Тёмная'
    return '◑ Светлая'
  }

  const cycleTheme = () => {
    const next = theme === 'auto' ? 'dark' : (theme === 'dark' ? 'light' : 'auto')
    onThemeChange(next)
  }

  const validate = () => {
    if (!email.trim()) {
      setError('Email не может быть пустым')
      return false
    }
    if (!password) {
      setError('Пароль не может быть пустым')
      return false
    }
    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Пароли не совпадают')
        return false
      }
      if (password.length < 6) {
        setError('Пароль должен быть минимум 6 символов')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)

    try {
      // Simple local authentication without Supabase OTP
      if (mode === 'register') {
        // Check if user exists
        const exists = JSON.parse(localStorage.getItem('qs_users') || '[]').find(u => u.email === email)
        if (exists) {
          setError('Пользователь с этим email уже существует')
          setLoading(false)
          return
        }

        // Register new user
        const users = JSON.parse(localStorage.getItem('qs_users') || '[]')
        const newUser = {
          id: Date.now().toString(),
          email,
          password, // Note: In production, NEVER store plain password - hash it server-side
          createdAt: new Date().toISOString()
        }
        users.push(newUser)
        localStorage.setItem('qs_users', JSON.stringify(users))
        
        setTimeout(() => {
          onLogin({
            id: newUser.id,
            email: newUser.email
          })
        }, 500)
      } else {
        // Login
        const users = JSON.parse(localStorage.getItem('qs_users') || '[]')
        const user = users.find(u => u.email === email && u.password === password)

        if (!user) {
          setError('Неверные email или пароль')
          setLoading(false)
          return
        }

        setTimeout(() => {
          onLogin({
            id: user.id,
            email: user.email
          })
        }, 500)
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <div className="auth-avatar">🚭</div>
          <div style={{ flex: 1 }}>
            <div className="auth-title">QuitSmoke</div>
            <div className="auth-subtitle">Бросай курить вместе</div>
          </div>
          <button className="theme-btn" onClick={cycleTheme}>
            {getThemeLabel()}
          </button>
        </header>

        <div className="auth-mode-switch">
          <button
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            Вход
          </button>
          <button
            className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label>Подтверждение пароля</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : 'Зарегистрироваться')}
          </button>

          <div className="auth-footer">
            <p className="muted" style={{ fontSize: '13px', marginTop: '16px', textAlign: 'center' }}>
              {mode === 'login' 
                ? 'Нет аккаунта? Перейди на регистрацию' 
                : 'Уже есть аккаунт? Перейди на вход'}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
