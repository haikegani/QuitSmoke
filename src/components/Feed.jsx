import React, { useMemo } from 'react'
import './Feed.css'

export default function Feed({ user, puffCount, onAddPuff, quitPlan }) {
  const today = useMemo(() => {
    return new Date().toISOString().split('T')[0]
  }, [])

  const todayCount = puffCount[today] || 0

  const days = useMemo(() => {
    const start = new Date(quitPlan.startDate)
    const now = new Date(today)
    return Math.floor((now - start) / (1000 * 60 * 60 * 24))
  }, [quitPlan.startDate, today])

  const currentLimit = useMemo(() => {
    return Math.max(
      quitPlan.startLimit - days * quitPlan.dailyStep,
      quitPlan.minLimit
    )
  }, [quitPlan, days])

  const getStatusMessage = () => {
    if (todayCount === 0) {
      return '🎉 Сегодня без курения — отлично!'
    }
    if (todayCount < currentLimit) {
      return '✌️ Ты идёшь лучше плана'
    }
    return '⚠️ Лимит достигнут. Держись!'
  }

  const chartData = useMemo(() => {
    return Object.entries(puffCount)
      .slice(-14)
      .map(([date, count]) => ({
        date: new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
        count
      }))
  }, [puffCount])

  return (
    <div className="feed-container">
      <div className="status-box">
        <div className="status-message">{getStatusMessage()}</div>
        <div className="limit-info">
          Сегодня: <strong>{todayCount}</strong> из <strong>{currentLimit}</strong>
        </div>
      </div>

      <button className="puff-btn" onClick={onAddPuff}>
        + Затяжка
      </button>

      <div className="chart-container">
        <h3>📊 График (последние 14 дней)</h3>
        {chartData.length > 0 ? (
          <div className="simple-chart">
            {chartData.map((item, i) => {
              const maxHeight = Math.max(...chartData.map(x => x.count || 1)) || 1
              const height = (item.count / maxHeight) * 100
              return (
                <div key={i} className="chart-bar" title={item.count}>
                  <div className="bar-fill" style={{ height: `${height}%` }}></div>
                  <div className="bar-label">{item.date}</div>
                  <div className="bar-value">{item.count}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
            Нет данных. Начни отслеживать!
          </div>
        )}
      </div>

      <div className="stats-box">
        <div className="stat">
          <div className="stat-value">{days}</div>
          <div className="stat-label">Дней на плане</div>
        </div>
        <div className="stat">
          <div className="stat-value">{Object.keys(puffCount).length}</div>
          <div className="stat-label">Дней с данными</div>
        </div>
        <div className="stat">
          <div className="stat-value">{Object.values(puffCount).reduce((a, b) => a + b, 0)}</div>
          <div className="stat-label">Всего затяжек</div>
        </div>
      </div>
    </div>
  )
}

