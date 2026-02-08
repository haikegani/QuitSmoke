import React, { useState } from 'react'
import QuitPlan from './QuitPlan'
import './Profile.css'

export default function Profile({ user, onLogout, onUpdateUser, quitPlan, onUpdatePlan, puffCount }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showQuitPlan, setShowQuitPlan] = useState(false)
  const [username, setUsername] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [plan, setPlan] = useState(quitPlan)

  const handleSaveProfile = () => {
    onUpdateUser({ ...user, username, bio })
    setIsEditing(false)
  }

  const handleSavePlan = (newPlan) => {
    console.log('handleSavePlan called with:', newPlan)
    console.log('onUpdatePlan is:', onUpdatePlan)
    onUpdatePlan(newPlan)
    localStorage.setItem(`qs_plan_${user.id}`, JSON.stringify(newPlan))
    setPlan(newPlan)
    setShowQuitPlan(false)
  }

  const totalPuffs = Object.values(puffCount).reduce((a, b) => a + b, 0)
  const dayCount = Object.keys(puffCount).length

  if (showQuitPlan) {
    return (
      <div>
        <QuitPlan
          user={user}
          existingPlan={plan}
          onSavePlan={handleSavePlan}
        />
        <button 
          className="back-to-profile glass"
          onClick={() => setShowQuitPlan(false)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            zIndex: 100
          }}
        >
          ← Вернуться
        </button>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-card glass">
        <div className="profile-header">
          <div className="profile-avatar large">
            {username ? username.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-info">
            <div className="profile-username">{username || 'Анонимный пользователь'}</div>
            <div className="profile-email">{user.email}</div>
          </div>
        </div>

        {isEditing ? (
          <div className="profile-edit">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите юзернейм"
              maxLength="20"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="О себе (опционально)"
              maxLength="100"
            />
            <div className="button-row">
              <button onClick={handleSaveProfile}>✓ Сохранить</button>
              <button onClick={() => setIsEditing(false)} className="secondary">✕ Отмена</button>
            </div>
          </div>
        ) : (
          <>
            {bio && <div className="profile-bio">{bio}</div>}
            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
              ✎ Редактировать профиль
            </button>
          </>
        )}
      </div>

      <div className="stats-card glass">
        <h3>📊 Статистика</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-num">{totalPuffs}</div>
            <div className="stat-name">Затяжек</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{dayCount}</div>
            <div className="stat-name">Дней</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{Math.round(totalPuffs / Math.max(dayCount, 1))}</div>
            <div className="stat-name">В день</div>
          </div>
        </div>
      </div>

      <div className="plan-card glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3>🎯 Персональный план</h3>
          <button className="create-plan-btn" onClick={() => setShowQuitPlan(true)}>
            + Новый план
          </button>
        </div>

        {isEditing ? (
          <div className="plan-edit">
            <div className="form-row">
              <label>Начал с</label>
              <input type="number" value={plan.startLimit} onChange={(e) => setPlan({ ...plan, startLimit: parseInt(e.target.value) || 0 })} min="1" />
            </div>
            <div className="form-row">
              <label>Снижение в день</label>
              <input type="number" value={plan.dailyStep} onChange={(e) => setPlan({ ...plan, dailyStep: parseInt(e.target.value) || 0 })} min="0" />
            </div>
            <div className="form-row">
              <label>Минимум</label>
              <input type="number" value={plan.minLimit} onChange={(e) => setPlan({ ...plan, minLimit: parseInt(e.target.value) || 0 })} min="0" />
            </div>
            <button onClick={handleSavePlan} className="save-plan-btn">Сохранить</button>
          </div>
        ) : (
          <div className="plan-view">
            <div className="plan-line"><span>Начал:</span> <strong>{plan.startLimit}</strong></div>
            <div className="plan-line"><span>Снижение:</span> <strong>-{plan.dailyStep}</strong></div>
            <div className="plan-line"><span>Цель:</span> <strong>{plan.minLimit}</strong></div>
          </div>
        )}
      </div>

      <button className="logout-btn glass" onClick={onLogout}>
        🚪 Выйти
      </button>
    </div>
  )
}
