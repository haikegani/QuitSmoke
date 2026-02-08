import React, { useState } from 'react'
import './Friends.css'

export default function Friends({ friends, onAddFriend, onRemoveFriend }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    setError('')
    const emailTrim = email.trim()

    if (!emailTrim) {
      setError('Введите email друга')
      return
    }

    if (!emailTrim.includes('@')) {
      setError('Некорректный email')
      return
    }

    onAddFriend(emailTrim)
    setEmail('')
  }

  return (
    <div className="friends-container">
      <div className="add-friend-box">
        <h3>Добавить друга</h3>
        <div className="add-friend-form">
          <input
            type="email"
            placeholder="друг@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button onClick={handleAdd}>Добавить</button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="friends-list">
        <h3>
          Друзья ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>У тебя еще нет друзей</p>
            <p className="muted">Добавь друзей для поддержки!</p>
          </div>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend.id} className="friend-item">
                <div className="friend-info">
                  <div className="friend-avatar">
                    {friend.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="friend-name">{friend.name}</div>
                    <div className="muted friend-email">{friend.email}</div>
                  </div>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => onRemoveFriend(friend.id)}
                  title="Удалить"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
