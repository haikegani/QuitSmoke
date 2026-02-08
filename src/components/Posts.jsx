import React, { useState } from 'react'
import './Posts.css'

const REACTIONS = ['❤️', '😂', '😃', '😍', '🎉', '💪', '😢', '🔥']

export default function Posts({ user, friends }) {
  const [posts, setPosts] = useState(() => {
    const stored = localStorage.getItem('qs_posts')
    return stored ? JSON.parse(stored) : []
  })

  const [newPost, setNewPost] = useState('')
  const [activeReactionPanel, setActiveReactionPanel] = useState(null)

  const addPost = () => {
    if (!newPost.trim()) return

    const post = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username || user.email.split('@')[0],
      userEmail: user.email,
      avatar: user.avatarColor || '#667eea',
      content: newPost,
      timestamp: new Date().toISOString(),
      reactions: {} // {emoji: [userId1, userId2, ...]}
    }

    const updated = [post, ...posts]
    setPosts(updated)
    localStorage.setItem('qs_posts', JSON.stringify(updated))
    setNewPost('')
  }

  const addReaction = (postId, emoji) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        const reactions = { ...p.reactions }
        if (!reactions[emoji]) reactions[emoji] = []
        
        if (reactions[emoji].includes(user.id)) {
          reactions[emoji] = reactions[emoji].filter(id => id !== user.id)
          if (reactions[emoji].length === 0) delete reactions[emoji]
        } else {
          reactions[emoji].push(user.id)
        }
        
        return { ...p, reactions }
      }
      return p
    })
    setPosts(updated)
    localStorage.setItem('qs_posts', JSON.stringify(updated))
    setActiveReactionPanel(null)
  }

  const deletePost = (postId) => {
    if (posts.find(p => p.id === postId).userId !== user.id) return
    const updated = posts.filter(p => p.id !== postId)
    setPosts(updated)
    localStorage.setItem('qs_posts', JSON.stringify(updated))
  }

  const formatTime = (isoString) => {
    const date = new Date(isoString)
    const now = new Date()
    const diff = now - date

    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return `${minutes}м`
    if (hours < 24) return `${hours}ч`
    if (days < 7) return `${days}д`
    return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="posts-container">
      <div className="post-composer glass-effect">
        <div className="composer-header">
          <div className="user-mini-avatar">
            {(user.username || user.email).slice(0, 2).toUpperCase()}
          </div>
          <div className="composer-field">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Поделись тем, как дела с отказом... 💪"
              maxLength="500"
            />
            <div className="composer-footer">
              <div className="char-count">{newPost.length}/500</div>
              <button
                className="post-btn"
                onClick={addPost}
                disabled={!newPost.trim()}
              >
                Поделиться
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="posts-feed">
        {posts.length === 0 ? (
          <div className="empty-feed">
            <div className="empty-icon">💬</div>
            <p>Нет постов. Будь первым!</p>
          </div>
        ) : (
          posts.map(post => (
            <article key={post.id} className="post glass-effect">
              <div className="post-header">
                <div className="post-author">
                  <div className="post-avatar">{post.avatar}</div>
                  <div className="author-info">
                    <div className="author-name">{post.username}</div>
                    <div className="post-time">{formatTime(post.timestamp)}</div>
                  </div>
                </div>
                {post.userId === user.id && (
                  <button className="delete-btn" onClick={() => deletePost(post.id)}>
                    ✕
                  </button>
                )}
              </div>

              <div className="post-content">{post.content}</div>

              <div className="post-footer">
                <div className="reactions">
                  {Object.entries(post.reactions || {}).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      className={`reaction-btn ${users.includes(user.id) ? 'active' : ''}`}
                      onClick={() => addReaction(post.id, emoji)}
                      title={emoji}
                    >
                      {emoji} <span>{users.length}</span>
                    </button>
                  ))}
                  <button
                    className="add-reaction-btn"
                    onClick={() => setActiveReactionPanel(activeReactionPanel === post.id ? null : post.id)}
                  >
                    😊
                  </button>
                </div>

                {activeReactionPanel === post.id && (
                  <div className="reaction-panel">
                    {REACTIONS.map(emoji => (
                      <button
                        key={emoji}
                        className="reaction-option"
                        onClick={() => addReaction(post.id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
