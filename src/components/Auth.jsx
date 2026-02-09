import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

export default function Auth({ onLogin, theme, onThemeChange }) {
  // Modes: 'choice' (выбор метода) | 'otp' | 'password' (вход) | 'register' (регистрация)
  const [mode, setMode] = useState('choice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введи корректный email')
      return false
    }
    return true
  }

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email не может быть пустым')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введи корректный email')
      return false
    }
    return true
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!validate()) return

    setLoading(true)
    
    try {
      console.log('[AUTH] Отправляем OTP на:', email)
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true
        }
      })

      if (error) throw error

      console.log('✓ [AUTH] OTP отправлен на:', email)
      setMessage('Письмо с кодом отправлено на твой email!')
      setMode('otp')
      setOtp('')
    } catch (err) {
      console.error('❌ [AUTH] Ошибка OTP:', err.message)
      setError(err.message || 'Ошибка при отправке OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!otp.trim()) {
      setError('Введи код из письма')
      return
    }

    setLoading(true)

    try {
      console.log('[AUTH] Проверяем OTP...')

      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email'
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('Не удалось получить данные пользователя')
      }

      console.log('✓ [AUTH] Вход успешен:', data.user.email)
      console.log('  User ID:', data.user.id)

      // Создаем профиль пользователя в таблице profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || data.user.email.split('@')[0],
          avatar_color: data.user.user_metadata?.avatarColor || '#667eea',
          avatar: null,
          status: '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (profileError) {
        console.warn('⚠️ Не удалось создать профиль в БД:', profileError.message)
        // Продолжаем, потому что таблица может еще не быть создана
      } else {
        console.log('✓ Профиль добавлен в БД')
      }

      // Сохраняем локально для быстрого доступа
      localStorage.setItem('qs_user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || '',
        avatar: data.user.user_metadata?.avatar || null,
        avatarColor: data.user.user_metadata?.avatarColor || '#667eea'
      }))

      onLogin({
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || '',
        avatar: data.user.user_metadata?.avatar || null,
        avatarColor: data.user.user_metadata?.avatarColor || '#667eea'
      })
    } catch (err) {
      console.error('❌ [AUTH] Ошибка верификации:', err.message)
      setError(err.message || 'Неверный код')
    } finally {
      setLoading(false)
    }
  }

  // ============ Password методы ============
  const handlePasswordRegister = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!validateEmail()) return

    if (!password) {
      setError('Пароль не может быть пустым')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }

    if (password !== passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)

    try {
      console.log('[AUTH] Регистрируемся:', email)

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: email.split('@')[0],
            avatarColor: '#667eea'
          }
        }
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('Не удалось зарегистрировать пользователя')
      }

      console.log('✓ [AUTH] Регистрация успешна:', data.user.email)

      // Создаем профиль пользователя в таблице profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          username: email.split('@')[0],
          avatar_color: '#667eea',
          avatar: null,
          status: '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (profileError) {
        console.warn('⚠️ Не удалось создать профиль в БД:', profileError.message)
      } else {
        console.log('✓ Профиль добавлен в БД')
      }

      // Сохраняем локально для быстрого доступа
      localStorage.setItem('qs_user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        username: email.split('@')[0],
        avatar: null,
        avatarColor: '#667eea'
      }))

      onLogin({
        id: data.user.id,
        email: data.user.email,
        username: email.split('@')[0],
        avatar: null,
        avatarColor: '#667eea'
      })
    } catch (err) {
      console.error('❌ [AUTH] Ошибка регистрации:', err.message)
      setError(err.message || 'Ошибка при регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!validateEmail()) return

    if (!password) {
      setError('Пароль не может быть пустым')
      return
    }

    setLoading(true)

    try {
      console.log('[AUTH] Входим:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) throw error

      if (!data.user) {
        throw new Error('Не удалось получить данные пользователя')
      }

      console.log('✓ [AUTH] Вход по паролю успешен:', data.user.email)

      // Создаем профиль пользователя в таблице profiles (на случай если его еще нет)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          username: data.user.user_metadata?.username || data.user.email.split('@')[0],
          avatar_color: data.user.user_metadata?.avatarColor || '#667eea',
          avatar: null,
          status: '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (profileError) {
        console.warn('⚠️ Не удалось создать профиль в БД:', profileError.message)
      }

      // Сохраняем локально для быстрого доступа
      localStorage.setItem('qs_user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || data.user.email.split('@')[0],
        avatar: data.user.user_metadata?.avatar || null,
        avatarColor: data.user.user_metadata?.avatarColor || '#667eea'
      }))

      onLogin({
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || data.user.email.split('@')[0],
        avatar: data.user.user_metadata?.avatar || null,
        avatarColor: data.user.user_metadata?.avatarColor || '#667eea'
      })
    } catch (err) {
      console.error('❌ [AUTH] Ошибка входа:', err.message)
      setError(err.message || 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  // ============ UI ============
  return (
    <>
      {mode === 'choice' && (
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

            <div className="auth-form" style={{ padding: '20px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px' }}>
                Выбери способ входа
              </h3>

              <button
                className="submit-btn"
                onClick={() => {
                  setMode('password')
                  setError('')
                  setEmail('')
                  setPassword('')
                }}
                style={{ marginBottom: '12px' }}
              >
                🔐 Вход по паролю
              </button>

              <button
                className="submit-btn"
                onClick={() => {
                  setMode('otp')
                  setError('')
                  setEmail('')
                  setOtp('')
                }}
                style={{ 
                  marginBottom: '12px',
                  background: '#888',
                  opacity: 0.8
                }}
              >
                📧 Вход по OTP коду
              </button>

              <div className="auth-footer">
                <p className="muted" style={{ fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>
                  💡 Используй пароль для быстрого тестирования<br/>
                  📧 OTP удобнее для реальной работы
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'password' && (
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
                className={passwordConfirm ? 'mode-btn' : 'mode-btn active'}
                onClick={() => {
                  setPasswordConfirm('')
                  setPassword('')
                  setError('')
                }}
              >
                Вход
              </button>
              <button
                className={passwordConfirm ? 'mode-btn active' : 'mode-btn'}
                onClick={() => {
                  setPasswordConfirm('')
                  setPassword('')
                  setError('')
                }}
              >
                Регистрация
              </button>
              <button
                className="mode-btn"
                onClick={() => {
                  setMode('choice')
                  setEmail('')
                  setPassword('')
                  setPasswordConfirm('')
                  setError('')
                }}
                style={{ marginLeft: 'auto' }}
              >
                ← Назад
              </button>
            </div>

            <form onSubmit={passwordConfirm ? handlePasswordRegister : handlePasswordLogin} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  autoFocus
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
                {passwordConfirm && <p className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>Минимум 6 символов</p>}
              </div>

              {passwordConfirm && (
                <div className="form-group">
                  <label>Подтвердить пароль</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px' }}>{message}</div>}

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Загрузка...' : (passwordConfirm ? 'Зарегистрироваться' : 'Войти')}
              </button>

              <div className="auth-footer">
                <p className="muted" style={{ fontSize: '13px', marginTop: '16px', textAlign: 'center' }}>
                  {passwordConfirm 
                    ? 'Уже есть аккаунт? Нажми "Вход"' 
                    : 'Нет аккаунта? Нажми "Регистрация"'}
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {mode === 'otp' && (
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

            <form onSubmit={handleSendOtp} className="auth-form">
              <div className="auth-mode-switch">
                <button
                  type="button"
                  className="mode-btn"
                  onClick={() => {
                    setMode('choice')
                    setEmail('')
                    setOtp('')
                    setError('')
                  }}
                >
                  ← Назад
                </button>
              </div>

              <div className="form-group">
                <label>Твой Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  autoFocus
                />
                <p className="muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                  Мы отправим 6-значный код на твой email
                </p>
              </div>

              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px' }}>{message}</div>}

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Отправляю...' : 'Отправить код'}
              </button>
            </form>

            {message && (
              <form onSubmit={handleVerifyOtp} className="auth-form" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <div className="form-group">
                  <label>Введи код из письма</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    disabled={loading}
                    autoFocus
                    maxLength="6"
                    style={{ fontSize: '24px', letterSpacing: '4px', textAlign: 'center' }}
                  />
                  <p className="muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                    6 символов, действителен 10 минут
                  </p>
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Проверяю...' : 'Подтвердить'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
