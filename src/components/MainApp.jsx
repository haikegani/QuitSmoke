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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [friends, setFriends] = useState(() => {
    const stored = localStorage.getItem(`qs_friends_${user.id}`)
    return stored ? JSON.parse(stored) : []
  })

  const [friendRequests, setFriendRequests] = useState(() => {
    const stored = localStorage.getItem(`qs_friend_requests_${user.id}`)
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

  const sendFriendRequest = (toUser) => {
    if (friends.find(f => f.email === toUser.email)) {
      alert('Этот пользователь уже в друзьях')
      return
    }
    if (friendRequests.find(r => r.to === toUser.id)) {
      alert('Заявка уже отправлена')
      return
    }
    
    // Создаём заявку
    const request = {
      id: Date.now().toString(),
      from: user.id,
      fromEmail: user.email,
      fromUsername: user.username || user.email.split('@')[0],
      to: toUser.id,
      toEmail: toUser.email,
      sent: new Date().toISOString()
    }
    
    // Сохраняем заявку локально
    const newRequests = [...friendRequests, request]
    setFriendRequests(newRequests)
    localStorage.setItem(`qs_friend_requests_${user.id}`, JSON.stringify(newRequests))
    
    // Отправляем заявку получателю
    const toUserRequestsKey = `qs_friend_requests_${toUser.id}`
    const toUserRequests = localStorage.getItem(toUserRequestsKey)
    const toUserRequestsList = toUserRequests ? JSON.parse(toUserRequests) : []
    toUserRequestsList.push(request)
    localStorage.setItem(toUserRequestsKey, JSON.stringify(toUserRequestsList))
  }

  const acceptFriendRequest = (requestId) => {
    const request = friendRequests.find(r => r.id === requestId)
    if (!request) return
    
    // Добавляем в друзья
    const newFriend = {
      id: request.from,
      email: request.fromEmail,
      name: request.fromUsername,
      username: request.fromUsername,
      addedAt: new Date().toISOString()
    }
    
    const updatedFriends = [...friends, newFriend]
    setFriends(updatedFriends)
    localStorage.setItem(`qs_friends_${user.id}`, JSON.stringify(updatedFriends))
    
    // Удаляем заявку
    const updatedRequests = friendRequests.filter(r => r.id !== requestId)
    setFriendRequests(updatedRequests)
    localStorage.setItem(`qs_friend_requests_${user.id}`, JSON.stringify(updatedRequests))
    
    // Также добавляем текущего пользователя в друзья отправителю заявки
    const fromUserFriendsKey = `qs_friends_${request.from}`
    const fromUserFriends = localStorage.getItem(fromUserFriendsKey)
    const fromUserFriendsList = fromUserFriends ? JSON.parse(fromUserFriends) : []
    fromUserFriendsList.push({
      id: user.id,
      email: user.email,
      name: user.username || user.email.split('@')[0],
      username: user.username,
      addedAt: new Date().toISOString()
    })
    localStorage.setItem(fromUserFriendsKey, JSON.stringify(fromUserFriendsList))
  }

  const declineFriendRequest = (requestId) => {
    const updatedRequests = friendRequests.filter(r => r.id !== requestId)
    setFriendRequests(updatedRequests)
    localStorage.setItem(`qs_friend_requests_${user.id}`, JSON.stringify(updatedRequests))
  }

  const addFriend = (friendObj) => {
    sendFriendRequest(friendObj)
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
      {sidebarOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSidebarOpen(false)
        }}
        user={user}
        isOpen={sidebarOpen}
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
            friendRequests={friendRequests}
            onAddFriend={addFriend}
            onAcceptRequest={acceptFriendRequest}
            onDeclineRequest={declineFriendRequest}
            onRemoveFriend={removeFriend}
            user={user}
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
