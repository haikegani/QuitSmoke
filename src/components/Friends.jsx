import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Friends.css'

export default function Friends({ user = {}, onStartChat = () => {} }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
    
    // Проверяем новых пользователей каждые 5 секунд
    const interval = setInterval(loadUsers, 5000)
    return () => clearInterval(interval)
  }, [user?.id])

  const loadUsers = async () => {
    if (!user?.id) {
      console.log('❌ Нет user.id')
      return
    }

    try {
      console.log('[Friends] Загружаем пользователей из Supabase...')
      
      // Получаем всех пользователей из таблицы profiles (кроме текущего)
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)

      if (error) {
        console.warn('⚠️ Таблица profiles еще не создана, используем fallback')
        // Fallback: пытаемся получить из localStorage
        const stored = JSON.parse(localStorage.getItem('qs_users') || '[]')
        const filtered = stored.filter(u => u.id !== user.id).map(u => ({
          id: u.id,
          email: u.email,
          username: u.username || u.email.split('@')[0],
          avatarColor: u.avatarColor || '#667eea',
          status: u.status || '',
          avatar: u.avatar || null
        }))
        console.log('✓ Загружено из localStorage:', filtered.length)
        setAllUsers(filtered)
        setLoading(false)
        return
      }

      // Фильтруем данные
      const filteredUsers = (profilesData || [])
        .map(profile => ({
          id: profile.id,
          email: profile.email,
          username: profile.username || profile.email?.split('@')[0] || 'User',
          avatarColor: profile.avatar_color || '#667eea',
          status: profile.status || '',
          avatar: profile.avatar || null
        }))

      console.log('✓ Загружено пользователей:', filteredUsers.length)
      filteredUsers.forEach(u => console.log('  -', u.email))
      
      setAllUsers(filteredUsers)
      setLoading(false)
    } catch (error) {
      console.error('❌ Ошибка при загрузке пользователей:', error)
      setLoading(false)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setSelectedUser(null)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const q = query.toLowerCase().trim()
    console.log('🔍 Поиск:', q, 'из', allUsers.length, 'пользователей')
    
    const results = allUsers.filter(u => {
      const emailMatch = u.email?.toLowerCase().includes(q)
      const usernameMatch = u.username?.toLowerCase().includes(q)
      return emailMatch || usernameMatch
    })

    console.log('✓ Найдено:', results.length, 'совпадений')
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

        {/* Поле поиска */}
        <input
          type="text"
          placeholder="Ищи по email или юзернейму..."
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

      {searchQuery && searchResults.length === 0 && !loading && (
        <div className="empty-state glass">
          <div className="empty-icon">🔍</div>
          <p>Никого не найдено</p>
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
        <div>Пользователей в системе: {allUsers.length}</div>
        <div>Последний поиск: "{searchQuery}" → {searchResults.length} совпадений</div>
        <div>Status: {loading ? 'Загружаю...' : 'Готово'}</div>
      </div>
    </div>
  )
}
