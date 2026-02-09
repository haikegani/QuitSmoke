import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Sidebar from './Sidebar'
import Feed from './Feed'
import Friends from './Friends'
import Profile from './Profile'
import Posts from './Posts'
import Channels from './Channels'
import Chats from './Chats'
import Settings from './Settings'
import Debug from './Debug'
import './MainApp.css'

export default function MainApp({ user, onLogout, theme, onThemeChange, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState(() => {
    const isDebugEnabled = localStorage.getItem('qs_debug') === 'true'
    if (isDebugEnabled) {
      localStorage.removeItem('qs_debug')
      return 'debug'
    }
    return 'feed'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  
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

  // Обработчик для запуска чата с пользователем
  const handleStartChat = (targetUser) => {
    setActiveTab('chats')
  }

  // Загружаем пользователей для выбора в чатах
  useEffect(() => {
    loadUsers()
    const interval = setInterval(loadUsers, 10000)
    return () => clearInterval(interval)
  }, [user?.id])

  const loadUsers = async () => {
    if (!user?.id) return

    try {
      // Получаем всех пользователей из таблицы profiles (кроме текущего)
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)

      if (error) {
        // Fallback: пытаемся получить из localStorage
        const stored = JSON.parse(localStorage.getItem('qs_users') || '[]')
        const filtered = stored.filter(u => u.id !== user.id).map(u => ({
          id: u.id,
          email: u.email,
          name: u.username || u.email.split('@')[0],
          avatarColor: u.avatarColor || '#667eea',
          status: u.status || '',
          avatar: u.avatar || null
        }))
        setAllUsers(filtered)
        return
      }

      // Фильтруем данные
      const filteredUsers = (profilesData || [])
        .map(profile => ({
          id: profile.id,
          email: profile.email,
          name: profile.username || profile.email?.split('@')[0] || 'User',
          avatarColor: profile.avatar_color || '#667eea',
          status: profile.status || '',
          avatar: profile.avatar || null
        }))

      setAllUsers(filteredUsers)
    } catch (error) {
      console.error('[MainApp] Ошибка при загрузке пользователей:', error)
    }
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
          <Posts user={user} friends={[]} />
        )}
        {activeTab === 'channels' && (
          <Channels user={user} />
        )}
        {activeTab === 'chats' && (
          <Chats user={user} friends={allUsers} />
        )}
        {activeTab === 'friends' && (
          <Friends
            user={user}
            onStartChat={handleStartChat}
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
        {activeTab === 'debug' && (
          <Debug />
        )}
      </main>
    </div>
  )
}
