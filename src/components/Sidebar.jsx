import React from 'react'
import './Sidebar.css'

const MENU_ITEMS = [
  { id: 'feed', label: 'Лента', icon: '🔥', section: 'main' },
  { id: 'chats', label: 'Чаты', icon: '💬', section: 'social' },
  { id: 'friends', label: 'Друзья', icon: '👥', section: 'social' },
  { id: 'profile', label: 'Профиль', icon: '👤', section: 'user' },
  { id: 'settings', label: 'Настройки', icon: '⚙️', section: 'user' },
]

export default function Sidebar({ activeTab, onTabChange, user, unreadChats = 0, isOpen = false }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">QS</div>
        <div className="sidebar-brand">
          <div className="brand-name">QuitSmoke</div>
          <div className="brand-status">Online</div>
        </div>
      </div>

      {/* User Quick Access */}
      <div className="sidebar-user">
        <div className="user-avatar-mini">
          {user?.username ? user.username.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase()}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.username || user?.email?.split('@')[0]}</div>
          <div className="user-status">Активен</div>
        </div>
      </div>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {/* Main Section */}
        <div className="nav-section">
          <div className="nav-section-title">Главное</div>
          <div className="nav-items">
            {MENU_ITEMS.filter(item => item.section === 'main').map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Social Section */}
        <div className="nav-section">
          <div className="nav-section-title">Социальное</div>
          <div className="nav-items">
            {MENU_ITEMS.filter(item => item.section === 'social').map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">
                  {item.label}
                  {item.id === 'chats' && unreadChats > 0 && (
                    <span className="badge">{unreadChats}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="nav-section">
          <div className="nav-section-title">Личное</div>
          <div className="nav-items">
            {MENU_ITEMS.filter(item => item.section === 'user').map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="footer-tip">💡 Совет: Подпишись на популярные каналы</div>
      </div>
    </aside>
  )
}
