import React, { useState, useEffect } from 'react'
import './Friends.css'

export default function Friends({ user = {}, onStartChat = () => {} }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchMode, setSearchMode] = useState('username')
  const [debugInfo, setDebugInfo] = useState('Инициализация...')

  useEffect(() => {
    console.log('✓ Friends компонент загружен')
    console.log('Текущий пользователь:', user)
    
    if (!user || !user.id) {
      console.log('❌ Нет user или user.id')
      return
    }
    
    // Загрузить всех зарегистрированных пользователей
    const users = []
    
    console.log('=== ПОИСК ПОЛЬЗОВАТЕЛЕЙ ===')
    console.log('localStorage.length:', localStorage.length)
    
    // Ищем в qs_user_ префиксе
    console.log('Ищу qs_user_* ключи...')
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('qs_user_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key))
          console.log('  Найден:', key, userData.email)
          if (userData && userData.id !== user.id && userData.email) {
            users.push(userData)
            console.log('    ✓ Добавлен в список')
          }
        } catch (e) {
          console.error('  ❌ Ошибка при парсинге:', key, e)
        }
      }
    }
    
    // Также ищем в qs_users массиве (на случай если там хранятся)
    console.log('Ищу qs_users...')
    try {
      const allUsersData = JSON.parse(localStorage.getItem('qs_users') || '[]')
      console.log('  qs_users найден, пользователей:', allUsersData.length)
      if (Array.isArray(allUsersData)) {
        allUsersData.forEach(u => {
          if (u && u.id !== user.id && u.email && !users.find(x => x.id === u.id)) {
            console.log('  ✓ Добавлен:', u.email)
            users.push(u)
          }
        })
      }
    } catch (e) {
      console.error('  ❌ Ошибка qs_users:', e)
    }
    
    console.log('=== ИТОГО ===')
    console.log('Загружено пользователей:', users.length)
    users.forEach(u => console.log('  -', u.email))
    
    setDebugInfo(`Загружено: ${users.length} пользователей`)
    setAllUsers(users)
  }, [user?.id])

  const handleSearch = (query) => {
    setSearchQuery(query)
    setSelectedUser(null)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const q = query.toLowerCase().trim()
    console.log('Searching for:', q, 'in', allUsers.length, 'users')
    
    const results = allUsers.filter(u => {
      const username = (u.username || u.email.split('@')[0]).toLowerCase()
      const email = (u.email || '').toLowerCase()

      if (searchMode === 'username') {
        const match = username.includes(q)
        if (match) console.log('Match by username:', username)
        return match
      } else {
        const match = email.includes(q)
        if (match) console.log('Match by email:', email)
        return match
      }
    })

    console.log('Found results:', results.length)
    setSearchResults(results)
  }

  const handleStartChat = (targetUser) => {
    if (onStartChat) {
      onStartChat(targetUser)
    }
  }

  if (selectedUser) {
    return (
      <div className="friends-container">
        <div className="profile-view glass">
          <button className="btn-back" onClick={() => setSelectedUser(null)}>
            ← Назад
          </button>

          <div className="user-profile">
            <div className="profile-avatar" style={{
              background: selectedUser.avatarColor || '#667eea'
            }}>
              {(selectedUser.username || selectedUser.email.split('@')[0])
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="profile-info">
              <h2>{selectedUser.username || selectedUser.email.split('@')[0]}</h2>
              <p className="profile-email">{selectedUser.email}</p>
              
              {selectedUser.status && (
                <p className="profile-status">📝 {selectedUser.status}</p>
              )}

              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-label">Статус</span>
                  <span className="stat-value online">🟢 Онлайн</span>
                </div>
              </div>
            </div>

            <button 
              className="btn-message"
              onClick={() => {
                handleStartChat(selectedUser)
                setSelectedUser(null)
                setSearchQuery('')
                setSearchResults([])
              }}
            >
              💬 Написать сообщение
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="friends-container">
      <div className="friends-search glass">
        <h2>🔍 Найти людей</h2>

        {/* Режимы поиска */}
        <div className="search-mode-toggle">
          <button
            className={searchMode === 'username' ? 'mode-btn active' : 'mode-btn'}
            onClick={() => {
              setSearchMode('username')
              setSearchQuery('')
              setSearchResults([])
            }}
          >
            По юзернейму
          </button>
          <button
            className={searchMode === 'email' ? 'mode-btn active' : 'mode-btn'}
            onClick={() => {
              setSearchMode('email')
              setSearchQuery('')
              setSearchResults([])
            }}
          >
            По email
          </button>
        </div>

        {/* Поле поиска */}
        <input
          type="text"
          placeholder={
            searchMode === 'username'
              ? 'Введи юзернейм...'
              : 'Введи email...'
          }
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Результаты поиска */}
      {searchResults.length > 0 && (
        <div className="search-results glass">
          <div className="results-count">
            {searchResults.length} результат{searchResults.length !== 1 ? 'ов' : ''}
          </div>
          {searchResults.map(u => (
            <div
              key={u.id}
              className="search-result-item"
              onClick={() => setSelectedUser(u)}
            >
              <div className="user-info">
                <div
                  className="user-avatar-mini"
                  style={{
                    background: u.avatarColor || '#667eea'
                  }}
                >
                  <span className="avatar-text">
                    {(u.username || u.email.split('@')[0])
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="user-details">
                  <div className="user-username">
                    {u.username || u.email.split('@')[0]}
                  </div>
                  <div className="user-email">{u.email}</div>
                </div>
                <div className="user-status">🟢</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && (
        <div className="empty-state glass">
          <div className="empty-icon">🔍</div>
          <p>Никого не найдено</p>
        </div>
      )}

      {!searchQuery && (
        <div className="empty-state glass">
          <div className="empty-icon">👥</div>
          <p>Начни поиск чтобы найти людей</p>
          <p className="muted">Найди интересного человека и напиши ему!</p>
        </div>
      )}

      {/* DEBUG INFO */}
      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        background: '#e3f2fd', 
        borderRadius: '8px', 
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong>🔧 DEBUG:</strong>
        <div>Пользователей доступно: {allUsers.length}</div>
        <div>Последний поиск: "{searchQuery}" → {searchResults.length} совпадений</div>
        <div>user.id: {user?.id || 'не определен'}</div>
      </div>
    </div>
  )
}
