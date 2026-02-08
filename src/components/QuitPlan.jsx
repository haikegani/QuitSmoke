import React, { useState, useEffect } from 'react'
import './QuitPlan.css'

export default function QuitPlan({ user, existingPlan, onSavePlan }) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    currentDaily: existingPlan?.currentDaily || 20,
    yearsSmoked: existingPlan?.yearsSmoked || 5,
    age: existingPlan?.age || 30,
    goal: existingPlan?.goal || 'quit', // 'quit' или 'reduce'
    reductionTarget: existingPlan?.reductionTarget || 50, // проценты если "reduce"
  })
  const [calculatedPlan, setCalculatedPlan] = useState(null)
  const [saved, setSaved] = useState(false)

  const STEPS = [
    { title: '🚬 Сколько сигарет ты куришь в день?', key: 'currentDaily' },
    { title: '📅 Как долго ты куришь?', key: 'yearsSmoked' },
    { title: '👤 Твой возраст (опционально)', key: 'age' },
    { title: '🎯 Какая твоя цель?', key: 'goal' },
    { title: '✨ Твой план готов!' }
  ]

  const calculatePlan = (data) => {
    const dailyReduction = data.goal === 'quit' 
      ? Math.ceil(data.currentDaily / 30) // 30 дней на отказ
      : Math.ceil((data.currentDaily * data.reductionTarget / 100) / 30)

    const durationType = data.yearsSmoked < 1 ? 'месяцев' : 'лет'
    const durationValue = data.yearsSmoked < 1 ? Math.round(data.yearsSmoked * 12) : data.yearsSmoked

    // Рассчётный стресс (больше лет курения = больше стресса)
    const stressLevel = Math.min(data.yearsSmoked * 10, 100)

    // Персонализированный совет
    let advice = ''
    if (stressLevel > 50) {
      advice = 'У тебя солидный стаж курения, но ты сделал правильный выбор! 💪 Медитация и упражнения помогут справиться со стрессом.'
    }
    if (data.currentDaily > 30) {
      advice = 'В начале будет нелегко, но системный подход - ключ успеха. 📊 Отслеживай прогресс каждый день!'
    }
    if (data.age && data.age < 25) {
      advice = 'Молодого организму проще восстанавливаться! 🌱 Ты сможешь быстро заметить улучшения.'
    }

    const milestones = []
    const startDate = new Date()

    let currentDay = 0
    let currentDailyAmount = data.currentDaily

    while (currentDailyAmount > (data.goal === 'quit' ? 0 : data.currentDaily * (100 - data.reductionTarget) / 100)) {
      currentDay += 7 // Контрольные точки раз в неделю
      currentDailyAmount = Math.max(
        data.goal === 'quit' ? 0 : data.currentDaily * (100 - data.reductionTarget) / 100,
        data.currentDaily - (dailyReduction * (currentDay / 7))
      )
      const date = new Date(startDate.getTime() + currentDay * 24 * 60 * 60 * 1000)
      milestones.push({
        day: currentDay,
        dailyAmount: Math.ceil(Math.max(0, currentDailyAmount)),
        date: date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
      })
    }

    return {
      ...data,
      dailyReduction,
      durationType,
      durationValue,
      stressLevel,
      advice,
      milestones: milestones.slice(0, 8), // Показываем первые 8 контрольных точек
      completionDays: Math.ceil(data.currentDaily / dailyReduction),
      healthGains: calculateHealthGains(data)
    }
  }

  const calculateHealthGains = (data) => {
    // За сколько дней/месяцев произойдут эти изменения после отказа
    return [
      { time: '2 часа', gain: 'Давление придёт в норму' },
      { time: '24 часа', gain: 'CO выведется из организма' },
      { time: '48 часов', gain: 'Восстановится обоняние и вкус' },
      { time: '3 месяца', gain: 'Функция лёгких улучшится на 30%' },
      { time: '1 год', gain: 'Риск инфаркта снизится вдвое' },
      { time: '10 лет', gain: 'Риск рака лёгких как у некурящих' }
    ]
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }

  const handleValueChange = (value) => {
    setFormData(prev => ({
      ...prev,
      [STEPS[step].key]: value
    }))
  }

  const handleReductionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      reductionTarget: value
    }))
  }

  const generatePlan = () => {
    const plan = calculatePlan(formData)
    setCalculatedPlan(plan)
  }

  const savePlan = () => {
    if (calculatedPlan) {
      onSavePlan({
        ...calculatedPlan,
        createdAt: new Date().toISOString()
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const resetPlan = () => {
    setStep(0)
    setCalculatedPlan(null)
    setFormData({
      currentDaily: 20,
      yearsSmoked: 5,
      age: 30,
      goal: 'quit',
      reductionTarget: 50,
    })
  }

  // Шаг 1: Количество сигарет в день
  if (step === 0 && !calculatedPlan) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '25%' }}></div>
            </div>
            <span className="progress-text">1 из 5</span>
          </div>

          <h2>🚬 Сколько сигарет ты куришь в день?</h2>
          <p className="step-description">Точное число поможет создать реалистичный план</p>

          <div className="input-group">
            <input
              type="range"
              min="1"
              max="60"
              value={formData.currentDaily}
              onChange={(e) => handleValueChange(parseInt(e.target.value))}
              className="slider"
            />
            <div className="display-value">
              <span className="big-number">{formData.currentDaily}</span>
              <span className="unit">сигарет/день</span>
            </div>
          </div>

          <button className="btn-next glass" onClick={handleNext}>
            Дальше →
          </button>
        </div>
      </div>
    )
  }

  // Шаг 2: Как долго куришь
  if (step === 1 && !calculatedPlan) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '50%' }}></div>
            </div>
            <span className="progress-text">2 из 5</span>
          </div>

          <h2>📅 Как долго ты куришь?</h2>
          <p className="step-description">Помогает оценить физическую зависимость</p>

          <div className="input-group">
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={formData.yearsSmoked}
              onChange={(e) => handleValueChange(parseFloat(e.target.value))}
              className="slider"
            />
            <div className="display-value">
              <span className="big-number">{formData.yearsSmoked}</span>
              <span className="unit">
                {formData.yearsSmoked < 1 ? `${Math.round(formData.yearsSmoked * 12)} месяцев` : `${formData.yearsSmoked.toFixed(1)} лет`}
              </span>
            </div>
          </div>

          <button className="btn-next glass" onClick={handleNext}>
            Дальше →
          </button>
        </div>
      </div>
    )
  }

  // Шаг 3: Возраст
  if (step === 2 && !calculatedPlan) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '75%' }}></div>
            </div>
            <span className="progress-text">3 из 5</span>
          </div>

          <h2>👤 Твой возраст (опционально)</h2>
          <p className="step-description">Помогает дать персонализированные советы</p>

          <div className="input-group">
            <input
              type="number"
              min="13"
              max="120"
              value={formData.age}
              onChange={(e) => handleValueChange(parseInt(e.target.value))}
              className="number-input"
              placeholder="Введи возраст"
            />
          </div>

          <button className="btn-next glass" onClick={handleNext}>
            Дальше →
          </button>
        </div>
      </div>
    )
  }

  // Шаг 4: Цель
  if (step === 3 && !calculatedPlan) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '90%' }}></div>
            </div>
            <span className="progress-text">4 из 5</span>
          </div>

          <h2>🎯 Какая твоя цель?</h2>
          <p className="step-description">Выбери реалистичный путь для себя</p>

          <div className="goal-buttons">
            <button
              className={`goal-btn glass ${formData.goal === 'quit' ? 'active' : ''}`}
              onClick={() => handleValueChange('quit')}
            >
              <div className="goal-icon">🚭</div>
              <div className="goal-title">Полный отказ</div>
              <div className="goal-desc">Перестать курить совсем</div>
            </button>
            <button
              className={`goal-btn glass ${formData.goal === 'reduce' ? 'active' : ''}`}
              onClick={() => handleValueChange('reduce')}
            >
              <div className="goal-icon">📉</div>
              <div className="goal-title">Снижение</div>
              <div className="goal-desc">Постепенно снизить количество</div>
            </button>
          </div>

          {formData.goal === 'reduce' && (
            <div className="reduction-target">
              <label>На сколько процентов снизить за месяц?</label>
              <input
                type="range"
                min="10"
                max="90"
                step="10"
                value={formData.reductionTarget}
                onChange={(e) => handleReductionChange(parseInt(e.target.value))}
                className="slider"
              />
              <div className="target-value">{formData.reductionTarget}%</div>
            </div>
          )}

          <button className="btn-next glass" onClick={() => {
            generatePlan()
            handleNext()
          }}>
            Создать план →
          </button>
        </div>
      </div>
    )
  }

  // Финальный план
  if (calculatedPlan) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass full-plan">
          <div className="plan-header">
            <h2>✨ Твой персональный план</h2>
            <p>Создан специально для тебя на основе твоей ситуации</p>
          </div>

          {saved && <div className="saved-notification">✅ План сохранён в профиль!</div>}

          {/* Основная информация */}
          <div className="plan-summary">
            <div className="summary-item">
              <div className="label">Текущее потребление</div>
              <div className="value">{calculatedPlan.currentDaily} сигарет/день</div>
            </div>
            <div className="summary-item">
              <div className="label">Ежедневное снижение</div>
              <div className="value">{calculatedPlan.dailyReduction} сигарет/день</div>
            </div>
            <div className="summary-item">
              <div className="label">Ожидаемый срок</div>
              <div className="value">{calculatedPlan.completionDays} дней</div>
            </div>
            <div className="summary-item">
              <div className="label">Цель</div>
              <div className="value">
                {calculatedPlan.goal === 'quit' 
                  ? '🚭 Полный отказ' 
                  : `📉 -${calculatedPlan.reductionTarget}% (${Math.ceil(calculatedPlan.currentDaily * (100 - calculatedPlan.reductionTarget) / 100)} сигарет)`}
              </div>
            </div>
          </div>

          {/* Совет */}
          {calculatedPlan.advice && (
            <div className="advice-box">
              <p>{calculatedPlan.advice}</p>
            </div>
          )}

          {/* Контрольные точки */}
          <div className="milestones-section">
            <h3>📊 Твой путь к цели</h3>
            <div className="milestones-timeline">
              {calculatedPlan.milestones.map((m, idx) => (
                <div key={idx} className="milestone">
                  <div className="milestone-marker"></div>
                  <div className="milestone-content">
                    <div className="milestone-day">Неделя {Math.ceil(m.day / 7)}</div>
                    <div className="milestone-amount">{m.dailyAmount} сигарет/день</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Положительные результаты */}
          <div className="health-gains-section">
            <h3>🏥 Что ты получишь, отказавшись</h3>
            <div className="health-gains">
              {calculatedPlan.healthGains.map((gain, idx) => (
                <div key={idx} className="health-gain">
                  <div className="time">{gain.time}</div>
                  <div className="gain">{gain.gain}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Действия */}
          <div className="plan-actions">
            <button className="btn-save glass" onClick={savePlan}>
              💾 Сохранить в профиль
            </button>
            <button className="btn-reset glass" onClick={resetPlan}>
              🔄 Переделать план
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
