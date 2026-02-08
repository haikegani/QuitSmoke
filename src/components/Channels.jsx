import React, { useState } from 'react'
import './Channels.css'

export default function Channels({ user }) {
  const [channels, setChannels] = useState(() => {
    const stored = localStorage.getItem('qs_channels')
    return stored ? JSON.parse(stored) : []
  })

  const [subscriptions, setSubscriptions] = useState(() => {
    const stored = localStorage.getItem(`qs_subscriptions_${user.id}`)
    return stored ? JSON.parse(stored) : []
  })

  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState(null)

  const createChannel = () => {
    if (!newChannelName.trim()) return

    const channel = {
      id: Date.now().toString(),
      name: newChannelName,
      description: newChannelDesc,
      creator: user.email,
      creatorUsername: user.username || user.email.split('@')[0],
      createdAt: new Date().toISOString(),
      members: [user.email],
      posts: 0,
      icon: ['🔥', '💚', '🌟', '💪', '🎯', '📚', '🎭', '🚀'][Math.floor(Math.random() * 8)],
      isArchived: false,
    }

    const updated = [channel, ...channels]
    setChannels(updated)
    localStorage.setItem('qs_channels', JSON.stringify(updated))

    // Subscribe to own channel
    const subUpdated = [...subscriptions, channel.id]
    setSubscriptions(subUpdated)
    localStorage.setItem(`qs_subscriptions_${user.id}`, JSON.stringify(subUpdated))

    setNewChannelName('')
    setNewChannelDesc('')
    setShowCreateModal(false)
  }

  const subscribeToChannel = (channelId) => {
    if (subscriptions.includes(channelId)) {
      setSubscriptions(subscriptions.filter(id => id !== channelId))
      localStorage.setItem(`qs_subscriptions_${user.id}`, JSON.stringify(subscriptions.filter(id => id !== channelId)))
    } else {
      const updated = [...subscriptions, channelId]
      setSubscriptions(updated)
      localStorage.setItem(`qs_subscriptions_${user.id}`, JSON.stringify(updated))
    }
  }

  const deleteChannel = (channelId) => {
    const channel = channels.find(c => c.id === channelId)
    if (channel && channel.creator === user.email) {
      const updated = channels.filter(c => c.id !== channelId)
      setChannels(updated)
      localStorage.setItem('qs_channels', JSON.stringify(updated))
      setSelectedChannel(null)
    }
  }

  const myChannels = channels.filter(c => c.creator === user.email)
  const subscribedChannels = channels.filter(c => subscriptions.includes(c.id))
  const otherChannels = channels.filter(c => !subscriptions.includes(c.id) && c.creator !== user.email)

  return (
    <div className="channels-container">
      <div className="channels-header">
        <h2>📢 Каналы</h2>
        <button className="btn-create-channel" onClick={() => setShowCreateModal(true)}>
          + Создать
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Создать новый канал</h3>
            <div className="form-group">
              <label>Название канала</label>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Например: Мотивация"
                maxLength="30"
              />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={newChannelDesc}
                onChange={(e) => setNewChannelDesc(e.target.value)}
                placeholder="Опишите, о чем этот канал"
                maxLength="100"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button onClick={createChannel} className="btn-primary">Создать</button>
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Отмена</button>
            </div>
          </div>
        </div>
      )}

      <div className="channels-layout">
        <div className="channels-list">
          {myChannels.length > 0 && (
            <div className="channels-section">
              <h3>Мои каналы</h3>
              <div className="channel-cards">
                {myChannels.map(channel => (
                  <div
                    key={channel.id}
                    className={`channel-card ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <div className="channel-icon">{channel.icon}</div>
                    <div className="channel-name">{channel.name}</div>
                    <div className="channel-members">{channel.members.length} участников</div>
                    <div className="channel-badge">Мой канал</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {subscribedChannels.length > 0 && (
            <div className="channels-section">
              <h3>Подписки</h3>
              <div className="channel-cards">
                {subscribedChannels.map(channel => (
                  <div
                    key={channel.id}
                    className={`channel-card ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <div className="channel-icon">{channel.icon}</div>
                    <div className="channel-name">{channel.name}</div>
                    <div className="channel-members">{channel.members.length} участников</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherChannels.length > 0 && (
            <div className="channels-section">
              <h3>Доступные каналы</h3>
              <div className="channel-cards">
                {otherChannels.map(channel => (
                  <div
                    key={channel.id}
                    className={`channel-card ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <div className="channel-icon">{channel.icon}</div>
                    <div className="channel-name">{channel.name}</div>
                    <div className="channel-members">{channel.members.length} участников</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {channels.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
              <p>Нет каналов. Создайте свой первый канал!</p>
            </div>
          )}
        </div>

        {selectedChannel && (
          <div className="channel-detail">
            <div className="detail-header">
              <div className="detail-icon">{selectedChannel.icon}</div>
              <div className="detail-info">
                <h2>{selectedChannel.name}</h2>
                <p>{selectedChannel.description}</p>
              </div>
            </div>

            <div className="detail-stats">
              <div className="stat">
                <div className="stat-value">{selectedChannel.members.length}</div>
                <div className="stat-label">Участников</div>
              </div>
              <div className="stat">
                <div className="stat-value">{selectedChannel.posts}</div>
                <div className="stat-label">Постов</div>
              </div>
              <div className="stat">
                <div className="stat-value">@{selectedChannel.creatorUsername}</div>
                <div className="stat-label">Создатель</div>
              </div>
            </div>

            <div className="detail-actions">
              {selectedChannel.creator === user.email ? (
                <button
                  className="btn-danger"
                  onClick={() => {
                    if (confirm('Удалить этот канал?')) {
                      deleteChannel(selectedChannel.id)
                    }
                  }}
                >
                  🗑️ Удалить канал
                </button>
              ) : (
                <button
                  className={subscriptions.includes(selectedChannel.id) ? 'btn-secondary' : 'btn-primary'}
                  onClick={() => subscribeToChannel(selectedChannel.id)}
                >
                  {subscriptions.includes(selectedChannel.id) ? '✓ Отписаться' : '+ Подписаться'}
                </button>
              )}
            </div>

            <div className="channel-content">
              <h3>📝 Посты в канале</h3>
              <div className="content-placeholder">
                <p>Функция публикации постов в каналах скоро будет доступна 📍</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
