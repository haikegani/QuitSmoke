import React, { useState, useEffect } from 'react'
import './QuitPlan.css'

// Типы продуктов с их характеристиками
const PRODUCT_TYPES = {
  cigarettes: {
    name: '🚬 Сигареты',
    unit: 'штук',
    placeholder: 'Сигарет в день',
    defaultDaily: 20,
    range: [1, 100],
    tips: 'Средний пакет имеет 20 сигарет'
  },
  iqos: {
    name: '🍯 IQOS/Подики',
    unit: 'стиков',
    placeholder: 'Стиков в день',
    defaultDaily: 15,
    range: [1, 50],
    tips: 'Примерно 10-20 стиков в дне - это средний уровень'
  },
  vape: {
    name: '💨 Вейп',
    unit: 'мл жидкости',
    placeholder: 'Мл в день',
    defaultDaily: 5,
    range: [1, 30],
    tips: 'Средний вейп использует 3-10мл в день'
  },
  glo: {
    name: '🔥 Glo/Набиз',
    unit: 'неостанков',
    placeholder: 'Неостанков в день',
    defaultDaily: 12,
    range: [1, 40],
    tips: 'Примерно 10-15 неостанков в день - это норма'
  },
  pipe: {
    name: '🍂 Трубка/Трубочка',
    unit: 'грамм',
    placeholder: 'Грамм в день',
    defaultDaily: 5,
    range: [1, 30],
    tips: 'Одна заправка - примерно 1-3 грамма'
  },
  snus: {
    name: '🎒 Снюс/Насвай',
    unit: 'саше',
    placeholder: 'Саше в день',
    defaultDaily: 10,
    range: [1, 50],
    tips: 'Саше обычно длится 30-60 минут'
  }
}

// Умные вопросы для оценки потребления
const CONSUMPTION_QUESTIONS = {
  cigarettes: [
    {
      text: 'По скольку пачек в день? (пачка = 20 сиг)',
      estimate: (answer) => Math.round(answer * 20)
    },
    {
      text: 'Куришь больше по выходным?',
      options: ['Да, значительно', 'Чуть больше', 'Примерно одинаково'],
      adjust: (baseValue, idx) => baseValue * (1 + idx * 0.2)
    },
    {
      text: 'Сколько примерно часов в день ты куришь?',
      estimate: (hours) => Math.round((hours / 12) * 25) // примерно 1 сиг на 30 мин
    }
  ],
  iqos: [
    {
      text: 'Сколько раз ты пользуешься в день?',
      estimate: (times) => Math.round(times * 2)
    },
    {
      text: 'Как долго длится твоя сессия?',
      options: ['5 минут', '10 минут', '15+ минут'],
      sticks: [1, 2, 3]
    }
  ]
}

export default function QuitPlan({ user, existingPlan, onSavePlan }) {
  const [step, setStep] = useState(0)
  const [productType, setProductType] = useState('cigarettes')
  const [knowledgeLevel, setKnowledgeLevel] = useState(null) // 'exact', 'approximate', 'unknown'
  const [formData, setFormData] = useState({
    currentDaily: 20,
    yearsConsuming: 5,
    age: 30,
    goal: 'quit',
    reductionTarget: 50,
    consumptionAnswers: []
  })
  const [calculatedPlan, setCalculatedPlan] = useState(null)
  const [saved, setSaved] = useState(false)

  const product = PRODUCT_TYPES[productType]

  // Функция расчёта плана - ДОЛЖНА БЫТЬ В НАЧАЛЕ
  const calculatePlan = () => {
    const dailyReduction = formData.goal === 'quit'
      ? Math.ceil(formData.currentDaily / 30)
      : Math.ceil((formData.currentDaily * formData.reductionTarget / 100) / 30)

    const stressLevel = formData.yearsConsuming * 10

    let advice = 'Отлично, что ты решил(а) бросить! 💪'
    if (stressLevel > 50) {
      advice += ' У тебя большой стаж, но это означает, что ты сильный(ая) человек. Упражнения помогут.'
    }
    if (formData.currentDaily > product.defaultDaily * 2) {
      advice += ' Начни с небольших шагов - медленно, но уверенно!'
    }

    const milestones = []
    let currentDay = 0
    let currentAmount = formData.currentDaily

    while (currentAmount > (formData.goal === 'quit' ? 0 : formData.currentDaily * (100 - formData.reductionTarget) / 100)) {
      currentDay += 7
      currentAmount = Math.max(
        formData.goal === 'quit' ? 0 : formData.currentDaily * (100 - formData.reductionTarget) / 100,
        formData.currentDaily - (dailyReduction * (currentDay / 7))
      )
      const date = new Date()
      date.setDate(date.getDate() + currentDay)
      milestones.push({
        day: currentDay,
        amount: Math.ceil(Math.max(0, currentAmount)),
        date: date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
      })

      if (milestones.length >= 12) break
    }

    return {
      ...formData,
      productType,
      product,
      dailyReduction,
      advice,
      completionDays: Math.ceil(formData.currentDaily / dailyReduction),
      milestones: milestones.slice(0, 8),
      createdAt: new Date().toISOString()
    }
  }

  // Шаг 1: Выбор типа продукта
  if (step === 0) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-header">
            <h2>🎯 Выбери, от чего ты хочешь избавиться</h2>
            <p>Это поможет нам дать точный рекомендации</p>
          </div>

          <div className="product-grid">
            {Object.entries(PRODUCT_TYPES).map(([key, prod]) => (
              <button
                key={key}
                className={`product-btn glass ${productType === key ? 'active' : ''}`}
                onClick={() => {
                  setProductType(key)
                  setFormData(prev => ({
                    ...prev,
                    currentDaily: prod.defaultDaily
                  }))
                }}
              >
                <div className="product-icon">{prod.name.split(' ')[0]}</div>
                <div className="product-name">{prod.name}</div>
              </button>
            ))}
          </div>

          <button
            className="btn-next glass"
            onClick={() => setStep(1)}
            style={{ marginTop: '24px' }}
          >
            Далее →
          </button>
        </div>
      </div>
    )
  }

  // Шаг 2: Определяем уровень знания потребления
  if (step === 1 && !knowledgeLevel) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <span className="progress-text">1/4</span>
          </div>

          <h2>📊 Сколько ты {product.unit}?</h2>
          <p className="step-description">{product.tips}</p>

          <div className="knowledge-buttons">
            <button
              className="knowledge-btn glass"
              onClick={() => setKnowledgeLevel('exact')}
            >
              <div className="kb-icon">✓</div>
              <div className="kb-title">Знаю точно</div>
              <div className="kb-desc">Я отслеживаю и знаю точное число</div>
            </button>
            <button
              className="knowledge-btn glass"
              onClick={() => setKnowledgeLevel('approximate')}
            >
              <div className="kb-icon">≈</div>
              <div className="kb-title">Примерно</div>
              <div className="kb-desc">Расскажу примерно, выбрав из вариантов</div>
            </button>
            <button
              className="knowledge-btn glass"
              onClick={() => setKnowledgeLevel('unknown')}
            >
              <div className="kb-icon">?</div>
              <div className="kb-title">Не знаю</div>
              <div className="kb-desc">Ответлю на несколько вопросов, вы расчитаете</div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Шаг 2b: Точное число
  if (step === 1 && knowledgeLevel === 'exact') {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <span className="progress-text">1/4</span>
          </div>

          <h2>📊 {product.placeholder}</h2>

          <div className="input-group">
            <input
              type="range"
              min={product.range[0]}
              max={product.range[1]}
              value={formData.currentDaily}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                currentDaily: parseInt(e.target.value)
              }))}
              className="slider"
            />
            <div className="display-value">
              <span className="big-number">{formData.currentDaily}</span>
              <span className="unit">{product.unit}/день</span>
            </div>
          </div>

          <button
            className="btn-next glass"
            onClick={() => setStep(2)}
            style={{ marginTop: '24px' }}
          >
            Далее →
          </button>
        </div>
      </div>
    )
  }

  // Шаг 2c: Приблизительно
  if (step === 1 && knowledgeLevel === 'approximate') {
    const presets = [
      { label: 'Немного', value: product.defaultDaily * 0.5 },
      { label: 'Средне', value: product.defaultDaily },
      { label: 'Довольно много', value: product.defaultDaily * 1.5 },
      { label: 'Очень много', value: product.defaultDaily * 2.5 }
    ]

    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <span className="progress-text">1/4</span>
          </div>

          <h2>📊 Выбери свой уровень потребления</h2>

          <div className="preset-buttons">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                className="preset-btn glass"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    currentDaily: Math.round(preset.value)
                  }))
                  setStep(2)
                }}
              >
                <div className="preset-label">{preset.label}</div>
                <div className="preset-value">
                  {Math.round(preset.value)} {product.unit}
                </div>
              </button>
            ))}
          </div>

          <button
            className="back-btn glass"
            onClick={() => setKnowledgeLevel(null)}
          >
            ← Вернуться
          </button>
        </div>
      </div>
    )
  }

  // Шаг 2d: Не знаю - умные вопросы
  if (step === 1 && knowledgeLevel === 'unknown') {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <span className="progress-text">1/4</span>
          </div>

          <h2>💭 Помогу тебе вычислить</h2>
          <p className="step-description">На основе ответов постараюсь оценить твоё потребление</p>

          <div className="smart-questions">
            {productType === 'cigarettes' && (
              <>
                <div className="question-group">
                  <label>По скольку пачек (по 20 сигарет) в день?</label>
                  <input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={formData.consumptionAnswers[0] || 1}
                    onChange={(e) => {
                      const packs = parseFloat(e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        currentDaily: Math.round(packs * 20),
                        consumptionAnswers: [packs]
                      }))
                    }}
                    placeholder="пачек"
                  />
                  <small>{formData.currentDaily} сигарет/день</small>
                </div>

                <div className="question-group">
                  <label>Куришь больше по выходным или в стрессе?</label>
                  <select
                    onChange={(e) => {
                      const mult = [1, 1.2, 1.5][e.target.value]
                      setFormData(prev => ({
                        ...prev,
                        currentDaily: Math.round(prev.currentDaily * mult)
                      }))
                    }}
                  >
                    <option value="0">Примерно одинаково</option>
                    <option value="1">Чуть больше</option>
                    <option value="2">Значительно больше</option>
                  </select>
                </div>
              </>
            )}

            {productType === 'iqos' && (
              <div className="question-group">
                <label>Сколько раз ты пользуешься в день?</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.consumptionAnswers[0] || 10}
                  onChange={(e) => {
                    const times = parseInt(e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      currentDaily: Math.round(times * 1.5),
                      consumptionAnswers: [times]
                    }))
                  }}
                  placeholder="раз в день"
                />
                <small>{formData.currentDaily} стиков/день</small>
              </div>
            )}

            <button
              className="btn-next glass"
              onClick={() => setStep(2)}
              style={{ marginTop: '24px' }}
            >
              Далее →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Шаг 3: Как долго потребляешь
  if (step === 2) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <span className="progress-text">2/4</span>
          </div>

          <h2>📅 Как долго ты это потребляешь?</h2>

          <div className="input-group">
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={formData.yearsConsuming}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                yearsConsuming: parseFloat(e.target.value)
              }))}
              className="slider"
            />
            <div className="display-value">
              <span className="big-number">{formData.yearsConsuming}</span>
              <span className="unit">
                {formData.yearsConsuming < 1 
                  ? `${Math.round(formData.yearsConsuming * 12)} месяцев` 
                  : `${formData.yearsConsuming.toFixed(1)} лет`}
              </span>
            </div>
          </div>

          <button className="btn-next glass" onClick={() => setStep(3)}>
            Далее →
          </button>
        </div>
      </div>
    )
  }

  // Шаг 4: Цель
  if (step === 3) {
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-progress">
            <span className="progress-text">3/4</span>
          </div>

          <h2>🎯 Какая твоя цель?</h2>

          <div className="goal-buttons">
            <button
              className={`goal-btn glass ${formData.goal === 'quit' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, goal: 'quit' }))}
            >
              <div className="goal-icon">🚭</div>
              <div className="goal-title">Полный отказ</div>
              <div className="goal-desc">Перестать совсем</div>
            </button>
            <button
              className={`goal-btn glass ${formData.goal === 'reduce' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, goal: 'reduce' }))}
            >
              <div className="goal-icon">📉</div>
              <div className="goal-title">Снижение</div>
              <div className="goal-desc">Постепенно сокращать</div>
            </button>
          </div>

          {formData.goal === 'reduce' && (
            <div className="reduction-target">
              <label>На сколько % снизить за месяц?</label>
              <input
                type="range"
                min="10"
                max="90"
                step="10"
                value={formData.reductionTarget}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  reductionTarget: parseInt(e.target.value)
                }))}
                className="slider"
              />
              <div className="target-value">{formData.reductionTarget}%</div>
            </div>
          )}

          <button
            className="btn-next glass"
            onClick={() => {
              try {
                const plan = calculatePlan()
                console.log('Plan calculated:', plan)
                setCalculatedPlan(plan)
                setStep(4)
              } catch (e) {
                console.error('Error calculating plan:', e)
              }
            }}
          >
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
            <p>Специально для тебя на основе твоих данных</p>
          </div>

          {saved && <div className="saved-notification">✅ План сохранён!</div>}

          <div className="plan-summary">
            <div className="summary-item">
              <div className="label">Тип</div>
              <div className="value">{calculatedPlan.product.name}</div>
            </div>
            <div className="summary-item">
              <div className="label">Потребление</div>
              <div className="value">{calculatedPlan.currentDaily} {product.unit}/день</div>
            </div>
            <div className="summary-item">
              <div className="label">Срок</div>
              <div className="value">{calculatedPlan.completionDays} дней</div>
            </div>
            <div className="summary-item">
              <div className="label">Снижение</div>
              <div className="value">-{calculatedPlan.dailyReduction} {product.unit}/день</div>
            </div>
          </div>

          <div className="advice-box">
            <p>💡 {calculatedPlan.advice}</p>
          </div>

          <div className="milestones-section">
            <h3>📊 Твой путь к цели</h3>
            <div className="milestones">
              {calculatedPlan.milestones.map((m, idx) => (
                <div key={idx} className="milestone">
                  <div className="week">W{(m.day / 7)}</div>
                  <div className="amount">{m.amount} {product.unit}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="plan-actions">
            <button
              className="btn-save glass"
              onClick={() => {
                console.log('Save clicked, calculatedPlan:', calculatedPlan)
                console.log('onSavePlan function:', onSavePlan)
                if (onSavePlan) {
                  onSavePlan(calculatedPlan)
                  setSaved(true)
                  setTimeout(() => setSaved(false), 2000)
                } else {
                  console.error('onSavePlan is not a function!')
                }
              }}
            >
              💾 Сохранить план
            </button>
          </div>
        </div>
      </div>
    )
  }
}
