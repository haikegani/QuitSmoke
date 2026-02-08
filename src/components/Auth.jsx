import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Auth.css'

export default function Auth({ onLogin, theme, onThemeChange }) {
  const [mode, setMode] = useState('email') // 'email' | 'otp'
  const [email, setEmail] = useState('')
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

        {mode === 'email' ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="auth-mode-switch">
              <div className="mode-label" style={{ textAlign: 'center', padding: '16px 0', fontSize: '14px', color: '#666' }}>
                Вход через OTP код
              </div>
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
                Мы отправим код для входа, регистрация не требуется
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

            <div className="auth-footer">
              <p className="muted" style={{ fontSize: '13px', marginTop: '16px', textAlign: 'center' }}>
                Один код на всех - простая и безопасная авторизация
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="auth-mode-switch">
              <button
                type="button"
                className="mode-btn"
                onClick={() => {
                  setMode('email')
                  setOtp('')
                  setError('')
                  setMessage('')
                }}
              >
                ← Назад
              </button>
            </div>

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
                Письмо с кодом отправляется 1-2 минуты
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px' }}>{message}</div>}

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Проверяю...' : 'Подтвердить'}
            </button>

            <div className="auth-footer">
              <p className="muted" style={{ fontSize: '13px', marginTop: '16px', textAlign: 'center' }}>
                Проверь спам, если не видишь письма
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
