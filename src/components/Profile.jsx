import React, { useState } from 'react'
import './Profile.css'

export default function Profile({ user, onLogout, quitPlan, onUpdatePlan, puffCount }) {
  const [isEditing, setIsEditing] = useState(false)
  const [plan, setPlan] = useState(quitPlan)

  const handleSave = () => {
    onUpdatePlan(plan)
    localStorage.setItem(`qs_plan_${user.id}`, JSON.stringify(plan))
    setIsEditing(false)
  }

  const totalPuffs = Object.values(puffCount).reduce((a, b) => a + b, 0)
  const dayCount = Object.keys(puffCount).length

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="profile-info">
            <div className="profile-email">{user.email}</div>
            <div className="profile-id" style={{ fontSize: '11px' }}>ID: {user.id}</div>
          </div>
        </div>
      </div>

      <div className="stats-card">
        <h3>Статистика</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-num">{totalPuffs}</div>
            <div className="stat-name">Всего затяжек</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{dayCount}</div>
            <div className="stat-name">Дней тренировки</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{Math.round(totalPuffs / Math.max(dayCount, 1))}</div>
            <div className="stat-name">Среднее в день</div>
          </div>
        </div>
      </div>

      <div className="plan-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>План отказа от курения</h3>
          <button
            className="edit-btn"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '✓ Готово' : '✎ Редактировать'}
          </button>
        </div>

        {isEditing ? (
          <div className="plan-edit">
            <div className="plan-field">
              <label>Начальный лимит (затяжки/день)</label>
              <input
                type="number"
                value={plan.startLimit}
                onChange={(e) => setPlan({ ...plan, startLimit: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>
            <div className="plan-field">
              <label>Ежедневное снижение (затяжек)</label>
              <input
                type="number"
                value={plan.dailyStep}
                onChange={(e) => setPlan({ ...plan, dailyStep: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="plan-field">
              <label>Минимальный лимит</label>
              <input
                type="number"
                value={plan.minLimit}
                onChange={(e) => setPlan({ ...plan, minLimit: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="plan-field">
              <label>Дата начала</label>
              <input
                type="date"
                value={plan.startDate}
                onChange={(e) => setPlan({ ...plan, startDate: e.target.value })}
              />
            </div>
            <button className="save-btn" onClick={handleSave}>Сохранить план</button>
          </div>
        ) : (
          <div className="plan-view">
            <div className="plan-item">
              <span>Начальный лимит:</span>
              <strong>{plan.startLimit} затяжек/день</strong>
            </div>
            <div className="plan-item">
              <span>Ежедневное снижение:</span>
              <strong>{plan.dailyStep} затяжек</strong>
            </div>
            <div className="plan-item">
              <span>Минимальный лимит:</span>
              <strong>{plan.minLimit} затяжек</strong>
            </div>
            <div className="plan-item">
              <span>Дата начала:</span>
              <strong>{new Date(plan.startDate).toLocaleDateString('ru-RU')}</strong>
            </div>
          </div>
        )}
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Выйти из аккаунта
      </button>
    </div>
  )
}
