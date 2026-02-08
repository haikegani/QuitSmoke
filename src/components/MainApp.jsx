import React, { useState, useMemo } from 'react'
import Feed from './Feed'
import Friends from './Friends'
import Profile from './Profile'
import Posts from './Posts'
import './MainApp.css'

export default function MainApp({ user, onLogout, theme, onThemeChange, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('feed')
  const [friends, setFriends] = useState(() => {
    const stored = localStorage.getItem(`qs_friends_${user.id}`)
    return stored ? JSON.parse(stored) : []
  })

  const [puffCount, setPuffCount] = useState(() => {
    const stored = localStorage.getItem(`qs_puffs_${user.id}`)
    return stored ? JSON.parse(stored) : {}
  })

  const [quitPlan, setQuitPlan] = useState(() => {
    const stored = localStorage.getItem(`qs_plan_${user.id}`)
    return stored ? JSON.parse(stored) : {
      startLimit: 30,
      dailyStep: 1,
      startDate: new Date().toISOString().split('T')[0],
      minLimit: 0
    }
  })

  const getThemeLabel = () => {
    if (theme === 'auto') return 'Авто'
    if (theme === 'dark') return '◐'
    return '◑'
  }

  const cycleTheme = () => {
    const next = theme === 'auto' ? 'dark' : (theme === 'dark' ? 'light' : 'auto')
    onThemeChange(next)
  }

  const addFriend = (email) => {
    if (email === user.email) {
      alert('Не можешь добавить себя в друзья')
      return
    }
    if (friends.find(f => f.email === email)) {
      alert('Этот друг уже добавлен')
      return
    }
    const newFriend = {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      addedAt: new Date().toISOString()
    }
    const updated = [...friends, newFriend]
    setFriends(updated)
    localStorage.setItem(`qs_friends_${user.id}`, JSON.stringify(updated))
  }

  const removeFriend = (friendId) => {
    const updated = friends.filter(f => f.id !== friendId)
    setFriends(updated)
    localStorage.setItem(`qs_friends_${user.id}`, JSON.stringify(updated))
  }

  const addPuff = () => {
    const today = new Date().toISOString().split('T')[0]
    const updated = {
      ...puffCount,
      [today]: (puffCount[today] || 0) + 1
    }
    setPuffCount(updated)
    localStorage.setItem(`qs_puffs_${user.id}`, JSON.stringify(updated))
  }

  const handleLogout = () => {
    if (confirm('Ты уверен, что хочешь выйти?')) {
      onLogout()
    }
  }

  return (
    <div className="main-app">
      <header className="app-header">
        <div className="app-avatar">
          {user.email.slice(0, 2).toUpperCase()}
        </div>
        <div className="app-header-title">
          <div>QuitSmoke</div>
          <div className="muted" style={{ fontSize: '12px' }}>@{user.email}</div>
        </div>
        <button className="theme-btn-mini" onClick={cycleTheme}>
          {getThemeLabel()}
        </button>
      </header>

      <nav className="app-tabs">
        <button
          className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          🔥 Лента
        </button>
        <button
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          💬 Посты
        </button>
        <button
          className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          👥 Друзья
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          ⚙️ Профиль
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'feed' && (
          <Feed
            user={user}
            puffCount={puffCount}
            onAddPuff={addPuff}
            quitPlan={quitPlan}
            onUpdatePlan={setQuitPlan}
          />
        )}
        {activeTab === 'posts' && (
          <Posts user={user} friends={friends} />
        )}
        {activeTab === 'friends' && (
          <Friends
            friends={friends}
            onAddFriend={addFriend}
            onRemoveFriend={removeFriend}
          />
        )}
        {activeTab === 'profile' && (
          <Profile
            user={user}
            onLogout={handleLogout}
            quitPlan={quitPlan}
            onUpdatePlan={setQuitPlan}
            puffCount={puffCount}
            onUpdateUser={onUpdateUser}
          />
        )}
      </main>
    </div>
  )
}
