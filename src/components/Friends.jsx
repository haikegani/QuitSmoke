import React, { useState, useEffect } from 'react'
import './Friends.css'

export default function Friends({ friends, onAddFriend, onRemoveFriend, user }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [searchMode, setSearchMode] = useState('username')

  useEffect(() => {
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
        } catch (e) {
          // Пропустить неверные записи
        }
      }
    }
    setAllUsers(users)
  }, [user.id])

  const handleSearch = (query) => {
    setSearchQuery(query)
    setError('')
    setSuccess('')

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
    }).filter(u => !friends.find(f => f.email === u.email))

    setSearchResults(results)
  }

  const handleAdd = (foundUser) => {
    if (friends.find(f => f.email === foundUser.email)) {
      setError('Этот пользователь уже в друзьях')
      setTimeout(() => setError(''), 3000)
      return
    }

    onAddFriend(foundUser.email)
    setSearchQuery('')
    setSearchResults([])
    setSuccess(`${foundUser.username || foundUser.email.split('@')[0]} добавлен в друзья! 🎉`)
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="friends-container">
      <div className="friends-search">
        <h2>👥 Найти друзей</h2>

        <div className="search-mode-toggle">
          <button
            className={searchMode === 'username' ? 'active' : ''}
            onClick={() => {
              setSearchMode('username')
              setSearchQuery('')
              setSearchResults([])
            }}
          >
            По юзернейму
          </button>
          <button
            className={searchMode === 'email' ? 'active' : ''}
            onClick={() => {
              setSearchMode('email')
              setSearchQuery('')
              setSearchResults([])
            }}
          >
            По email
          </button>
        </div>

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

        {searchResults.length > 0 && (
          <div className="search-results">
            <div className="results-count">
              {searchResults.length} результат{searchResults.length !== 1 ? 'ов' : ''}
            </div>
            {searchResults.map(u => (
              <div key={u.id} className="search-result-item">
                <div className="user-info">
                  <div
                    className="user-avatar-mini"
                    style={{
                      background: `linear-gradient(135deg, ${
                        u.avatarColor || '#667eea'
                      }, ${u.avatarColor || '#667eea'}dd)`
                    }}
                  >
                    {(u.username || u.email.split('@')[0])
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div className="user-details">
                    <div className="user-username">
                      {u.username || u.email.split('@')[0]}
                    </div>
                    <div className="user-email">{u.email}</div>
                  </div>
                </div>
                <button
                  className="add-btn"
                  onClick={() => handleAdd(u)}
                >
                  + Добавить
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      <div className="friends-list">
        <h2>🤝 Мои друзья ({friends.length})</h2>

        {friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤔</div>
            <p>У тебя еще нет друзей</p>
            <p className="muted">Добавь друзей для взаимной поддержки!</p>
          </div>
        ) : (
          <div className="friends-grid">
            {friends.map((friend) => (
              <div key={friend.id} className="friend-card glass">
                <div
                  className="friend-avatar"
                  style={{
                    background: `linear-gradient(135deg, ${
                      friend.avatarColor || '#667eea'
                    }, ${friend.avatarColor || '#667eea'}dd)`
                  }}
                >
                  {(friend.name || friend.email.split('@')[0])
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="friend-name">
                  {friend.name || friend.email.split('@')[0]}
                </div>
                <div className="friend-email">{friend.email}</div>
                <button
                  onClick={() => onRemoveFriend(friend.id)}
                  className="btn-remove"
                >
                  ✕ Удалить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
