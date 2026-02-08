import React, { useMemo } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import './Feed.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

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

  const chartData = useMemo(() => {
    const entries = Object.entries(puffCount).slice(-30)
    const labels = entries.map(([date]) => {
      const d = new Date(date + 'T00:00:00')
      return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
    })
    const values = entries.map(([, count]) => count)
    const limits = entries.map((_, i) => {
      const dayOffset = i - entries.length + 1 + days
      return Math.max(quitPlan.startLimit - dayOffset * quitPlan.dailyStep, quitPlan.minLimit)
    })

    return {
      labels,
      datasets: [
        {
          label: 'Затяжки',
          data: values,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 4,
        },
        {
          label: 'Лимит',
          data: limits,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 2,
        }
      ]
    }
  }, [puffCount, quitPlan, days])

  const getStatusMessage = () => {
    if (todayCount === 0) {
      return '🎉 Сегодня без курения — отлично!'
    }
    if (todayCount < currentLimit) {
      return '✌️ Ты идёшь лучше плана'
    }
    return '⚠️ Лимит достигнут. Держись!'
  }

  return (
    <div className="feed-container">
      <div className="status-box">
        <div className="status-message">{getStatusMessage()}</div>
        <div className="limit-info">
          Сегодня: <strong>{todayCount}</strong> из <strong>{currentLimit}</strong>
        </div>
      </div>

      <button className="puff-btn" onClick={onAddPuff}>
        Записать затяжку
      </button>

      <div className="chart-container">
        <h3>График прогресса (ла30 дней)</h3>
        {Object.keys(puffCount).length > 0 ? (
          <Line data={chartData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              }
            },
            scales: {
              y: {
                beginAtZero: true,
              }
            }
          }} height={200} />
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
