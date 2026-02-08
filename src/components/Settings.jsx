import React, { useState } from 'react'
import './Settings.css'

export default function Settings({ user, onUpdateUser, theme, onThemeChange, onLogout }) {
  const [username, setUsername] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [avatarColor, setAvatarColor] = useState(user.avatarColor || '#667eea')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || null)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const avatarColors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#30b0fe'
  ]

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB max
        alert('Файл слишком большой (максимум 1MB)')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      const updates = {
        username: username.trim(),
        bio: bio.trim(),
        avatarColor,
        avatar: avatarPreview
      }
      onUpdateUser(updates)
      setSuccess('Профиль обновлён! ✨')
      setTimeout(() => setSuccess(''), 3000)
      setIsSaving(false)
    }, 300)
  }

  const handleThemeChange = (newTheme) => {
    const themes = ['light', 'dark', 'auto']
    const currentIndex = themes.indexOf(theme || 'auto')
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    onThemeChange(nextTheme)
  }

  const themeLabels = {
    light: '☀️ Светлая',
    dark: '🌙 Тёмная',
    auto: '🔄 Авто'
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ Настройки</h1>
        <p>Управляй своим профилем и предпочтениями</p>
      </div>

      {success && <div className="success-notification">{success}</div>}

      {/* Profile Settings */}
      <div className="settings-section glass">
        <div className="section-title">
          <span>👤 Профиль</span>
        </div>
        
        <div className="setting-item">
          <label>Юзернейм</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите юзернейм"
            maxLength="20"
          />
          <div className="char-hint">{username.length}/20</div>
        </div>

        <div className="setting-item">
          <label>Обо мне</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажи о себе..."
            maxLength="100"
            rows="4"
          />
          <div className="char-hint">{bio.length}/100</div>
        </div>

        <div className="setting-item">
          <label>Аватар</label>
          <div className="avatar-upload-section">
            <div className="avatar-preview-container">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Preview" 
                  className="avatar-preview-image"
                />
              ) : (
                <div
                  className="avatar-preview-fallback"
                  style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)` }}
                >
                  {username.slice(0, 2).toUpperCase() || user.email.split('@')[0].slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="upload-inputs">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                id="avatar-upload"
                className="file-input"
              />
              <label htmlFor="avatar-upload" className="upload-btn glass">
                📸 Загрузить изображение
              </label>
              {avatarPreview && (
                <button
                  onClick={() => {
                    setAvatarPreview(null)
                    setAvatarFile(null)
                  }}
                  className="clear-btn"
                >
                  ✕ Очистить
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="setting-item">
          <label>Цвет аватара (если нет изображения)</label>
          <div className="color-picker">
            {avatarColors.map(color => (
              <button
                key={color}
                className={`color-option ${avatarColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setAvatarColor(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <button
          className="save-btn glass"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '💾 Сохраняю...' : '💾 Сохранить'}
        </button>
      </div>

      {/* Theme Settings */}
      <div className="settings-section glass">
        <div className="section-title">
          <span>🎨 Интерфейс</span>
        </div>
        
        <div className="setting-item">
          <label>Тема</label>
          <div className="theme-options">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              ☀️ Светлая
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              🌙 Тёмная
            </button>
            <button
              className={`theme-btn ${theme === 'auto' ? 'active' : ''}`}
              onClick={() => handleThemeChange('auto')}
            >
              ⚙️ Авто
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="settings-section glass">
        <div className="section-title">
          <span>🔒 Приватность</span>
        </div>
        
        <div className="setting-item checkbox">
          <label>
            <input type="checkbox" defaultChecked={true} />
            <span>Разрешить добавлять в друзья</span>
          </label>
        </div>

        <div className="setting-item checkbox">
          <label>
            <input type="checkbox" defaultChecked={true} />
            <span>Показывать мой статус</span>
          </label>
        </div>

        <div className="setting-item checkbox">
          <label>
            <input type="checkbox" defaultChecked={false} />
            <span>Уведомления о новых сообщениях</span>
          </label>
        </div>
      </div>

      {/* About Section */}
      <div className="settings-section glass">
        <div className="section-title">
          <span>ℹ️ Информация</span>
        </div>
        
        <div className="about-item">
          <span>Версия приложения</span>
          <span className="value">1.2.0</span>
        </div>

        <div className="about-item">
          <span>Почта</span>
          <span className="value">{user.email}</span>
        </div>

        <div className="about-item">
          <span>ID пользователя</span>
          <span className="value code">{user.id.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  )
}
