import React, { useState, useEffect } from 'react'
import './Friends.css'

export default function Friends({ user = {}, onStartChat = () => {} }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchMode, setSearchMode] = useState('username')

  useEffect(() => {
    if (!user || !user.id) return
    
    // Загрузить всех зарегистрированных пользователей
    const users = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('qs_user_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key))
          if (userData && userData.id !== user.id) {
            users.push(userData)
          }
        } catch (e) {}
      }
    }
    setAllUsers(users)
  }, [user?.id])

  const handleSearch = (query) => {
    setSearchQuery(query)
    setSelectedUser(null)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results = allUsers.filter(u => {
      const username = (u.username || u.email.split('@')[0]).toLowerCase()
      const email = u.email.toLowerCase()
      const q = query.toLowerCase()

      if (searchMode === 'username') {
        return username.includes(q)
      } else {
        return email.includes(q)
      }
    })

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
    </div>
  )
}
