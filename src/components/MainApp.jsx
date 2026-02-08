import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Feed from './Feed'
import Friends from './Friends'
import Profile from './Profile'
import Posts from './Posts'
import Channels from './Channels'
import Chats from './Chats'
import Settings from './Settings'
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

  const addFriend = (friendObj) => {
    if (friends.find(f => f.email === friendObj.email)) {
      alert('Этот друг уже добавлен')
      return
    }
    const updated = [...friends, friendObj]
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
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
      />

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
        {activeTab === 'channels' && (
          <Channels user={user} />
        )}
        {activeTab === 'chats' && (
          <Chats user={user} friends={friends} />
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
        {activeTab === 'settings' && (
          <Settings
            user={user}
            onUpdateUser={onUpdateUser}
            onLogout={handleLogout}
            theme={theme}
            onThemeChange={onThemeChange}
          />
        )}
      </main>
    </div>
  )
}
