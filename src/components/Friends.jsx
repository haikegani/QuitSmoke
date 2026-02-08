import React, { useState, useEffect } from 'react'
import './Friends.css'

export default function Friends({ 
  friends = [], 
  friendRequests = [],
  onAddFriend = () => {}, 
  onAcceptRequest = () => {},
  onDeclineRequest = () => {},
  onRemoveFriend = () => {}, 
  user = {} 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [searchMode, setSearchMode] = useState('username')

  // Убедимся, что friends - это массив
  const friendsList = Array.isArray(friends) ? friends : []
  const requestsList = Array.isArray(friendRequests) ? friendRequests : []

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
        } catch (e) {
          // Пропустить неверные записи
        }
      }
    }
    setAllUsers(users)
  }, [user?.id])

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
    }).filter(u => !friendsList.find(f => f.email === u.email))

    setSearchResults(results)
  }

  const handleAdd = (foundUser) => {
    if (!foundUser || !foundUser.email) return

    if (friendsList.find(f => f.email === foundUser.email)) {
      setError('Этот пользователь уже в друзьях')
      setTimeout(() => setError(''), 3000)
      return
    }

    // Передаём полный объект пользователя
    onAddFriend({
      id: foundUser.id || Date.now().toString(),
      email: foundUser.email,
      name: foundUser.username || foundUser.email.split('@')[0],
      username: foundUser.username,
      avatar: foundUser.avatar || null,
      avatarColor: foundUser.avatarColor || '#667eea',
      addedAt: new Date().toISOString()
    })
    
    setSearchQuery('')
    setSearchResults([])
    setSuccess(`${foundUser.username || foundUser.email.split('@')[0]} добавлен в друзья! 🎉`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleRemove = (friendId) => {
    if (onRemoveFriend && typeof onRemoveFriend === 'function') {
      onRemoveFriend(friendId)
    }
  }

  const handleAccept = (requestId) => {
    if (onAcceptRequest && typeof onAcceptRequest === 'function') {
      onAcceptRequest(requestId)
      setSuccess('Заявка принята! 🎉')
      setTimeout(() => setSuccess(''), 2000)
    }
  }

  const handleDecline = (requestId) => {
    if (onDeclineRequest && typeof onDeclineRequest === 'function') {
      onDeclineRequest(requestId)
      setSuccess('Заявка отклонена')
      setTimeout(() => setSuccess(''), 2000)
    }
  }

  return (
    <div className="friends-container">
      {/* Заявки в друзья */}
      {requestsList.length > 0 && (
        <div className="friend-requests">
          <h2>📬 Заявки в друзья ({requestsList.length})</h2>
          <div className="requests-list">
            {requestsList.map(request => (
              <div key={request.id} className="request-item">
                <div className="request-info">
                  <div className="request-avatar">
                    {request.fromUsername.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="request-from">{request.fromUsername}</div>
                    <div className="request-email">{request.fromEmail}</div>
                  </div>
                </div>
                <div className="request-buttons">
                  <button 
                    className="btn-accept"
                    onClick={() => handleAccept(request.id)}
                  >
                    ✓ Принять
                  </button>
                  <button 
                    className="btn-decline"
                    onClick={() => handleDecline(request.id)}
                  >
                    ✕ Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Поиск и добавление друзей */}
      <div className="friends-search">
        <h2>👥 Найти друзей</h2>

        {/* Кнопки режима поиска */}
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

        {/* Поле ввода поиска */}
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

        {/* Результаты поиска */}
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
                      background: u.avatar 
                        ? `url('${u.avatar}') center/cover`
                        : `linear-gradient(135deg, ${u.avatarColor || '#667eea'}, ${u.avatarColor || '#667eea'}dd)`
                    }}
                  >
                    {!u.avatar && (
                      <span className="avatar-text">
                        {(u.username || u.email.split('@')[0])
                          .slice(0, 1)
                          .toUpperCase()}
                      </span>
                    )}
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

        {/* Сообщения об ошибках/успехе */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      {/* Список друзей */}
      <div className="friends-list">
        <h2>🤝 Мои друзья ({friendsList.length})</h2>

        {friendsList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤔</div>
            <p>У тебя еще нет друзей</p>
            <p className="muted">Добавь друзей для взаимной поддержки!</p>
          </div>
        ) : (
          <div className="friends-grid">
            {friendsList.map((friend) => (
              <div key={friend.id || friend.email} className="friend-card glass">
                <div className="friend-avatar">
                  {friend.avatar ? (
                    <img 
                      src={friend.avatar} 
                      alt={friend.name || friend.email}
                      className="avatar-image"
                    />
                  ) : (
                    <div
                      className="avatar-fallback"
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
                  )}
                </div>
                <div className="friend-name">
                  {friend.name || friend.email.split('@')[0]}
                </div>
                <div className="friend-email">{friend.email}</div>
                <button
                  onClick={() => handleRemove(friend.id)}
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
