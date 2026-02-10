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
    consumptionAnswers: [],
    selectedProducts: [],
    wakeCraving: '',
    triggers: [],
    triedToQuit: 'no',
    previousAttempts: '',
    commonRelapse: '',
    motivations: [],
    readiness: 5,
    support: 'никто'
  })
  const [calculatedPlan, setCalculatedPlan] = useState(null)
  const [saved, setSaved] = useState(false)
  const [showGeneral, setShowGeneral] = useState(true)
  const [extraStep, setExtraStep] = useState(null)

  // Load saved intermediate answers from localStorage
  useEffect(() => {
    try {
      const key = `qs_quitplan_${user?.id}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        setFormData(prev => ({ ...prev, ...parsed }))
      }
    } catch (e) {
      console.warn('No saved quit plan')
    }
  }, [user?.id])

  // Autosave intermediate answers
  useEffect(() => {
    try {
      const key = `qs_quitplan_${user?.id}`
      localStorage.setItem(key, JSON.stringify(formData))
    } catch (e) {}
  }, [formData, user?.id])

  const validateCigarettes = () => {
    const c = formData.cigarettes || {}
    if (!c.daily || c.daily <= 0) return 'Укажите, сколько сигарет в день'
    return null
  }

  const proceedFromExtra = (current) => {
    const completed = new Set(formData.productsCompleted || [])
    if (current) completed.add(current)
    const selected = formData.selectedProducts || []
    const next = selected.find(p => !completed.has(p))
    setFormData(prev => ({ ...prev, productsCompleted: Array.from(completed) }))
    if (next) {
      setExtraStep(next)
    } else {
      setExtraStep(null)
      setStep(2)
    }
  }

  const validateVape = () => {
    const v = formData.vape || {}
    if (!v.strength && !v.puffs) return 'Укажите крепость или примерное количество затяжек'
    return null
  }

  const validateIqos = () => {
    const i = formData.iqos || {}
    if (!i.sticks || i.sticks <= 0) return 'Укажите количество стиков в день'
    return null
  }

  const validateSnus = () => {
    const s = formData.snus || {}
    if (!s.pouches || s.pouches <= 0) return 'Укажите количество паучей/саше в день'
    return null
  }

  const validateHookah = () => {
    const h = formData.hookah || {}
    if (!h.frequency) return 'Укажите частоту кальяна'
    return null
  }

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

    // Общие вопросы — показываем как модалку перед остальными шагами
    if (showGeneral) {
      return (
        <div className="quit-plan-container">
          <div className="plan-card glass">
            <div className="plan-header">
              <h2>Общие вопросы</h2>
              <p>Ответь на несколько общих вопросов — это поможет составить персональный план</p>
            </div>

            <div className="question-group">
              <label>Возраст</label>
              <input type="number" min="12" max="120" value={formData.age} onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))} />
            </div>

            <div className="question-group">
              <label>Сколько лет/месяцев употребляешь никотин?</label>
              <input type="number" min="0" step="0.5" value={formData.yearsConsuming} onChange={(e) => setFormData(prev => ({ ...prev, yearsConsuming: parseFloat(e.target.value) }))} />
              <small>Используй дробные значения для месяцев (0.5 = 6 месяцев)</small>
            </div>

            <div className="question-group">
              <label>Что именно используешь? (можно несколько)</label>
              <div className="product-checkboxes">
                {Object.keys(PRODUCT_TYPES).map(key => (
                  <label key={key} style={{ display: 'block', marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={(formData.selectedProducts || []).includes(key)}
                      onChange={(e) => {
                        const sel = new Set(formData.selectedProducts || [])
                        if (e.target.checked) sel.add(key); else sel.delete(key)
                        setFormData(prev => ({ ...prev, selectedProducts: Array.from(sel) }))
                      }}
                    /> {PRODUCT_TYPES[key].name}
                  </label>
                ))}
              </div>
            </div>

            <div className="question-group">
              <label>Как быстро после пробуждения тянет к никотину?</label>
              <select value={formData.wakeCraving || ''} onChange={(e) => setFormData(prev => ({ ...prev, wakeCraving: e.target.value }))}>
                <option value="">-- выбрать --</option>
                <option value="0-5">до 5 минут</option>
                <option value="6-30">6–30 минут</option>
                <option value="31-60">31–60 минут</option>
                <option value=">60">позже часа</option>
              </select>
            </div>

            <div className="question-group">
              <label>В каких ситуациях тянет больше всего? (выбери несколько)</label>
              {['стресс','скука','после еды','с друзьями','алкоголь','работа/учёба'].map(s => (
                <label key={s} style={{ display: 'block', marginBottom: 6 }}>
                  <input type="checkbox" checked={(formData.triggers||[]).includes(s)} onChange={(e) => {
                    const setT = new Set(formData.triggers||[])
                    if (e.target.checked) setT.add(s); else setT.delete(s)
                    setFormData(prev => ({ ...prev, triggers: Array.from(setT) }))
                  }} /> {s}
                </label>
              ))}
            </div>

            <div className="question-group">
              <label>Пробовал(а) ли бросать раньше?</label>
              <select value={formData.triedToQuit || 'no'} onChange={(e) => setFormData(prev => ({ ...prev, triedToQuit: e.target.value }))}>
                <option value="no">нет</option>
                <option value="yes">да</option>
              </select>
              {formData.triedToQuit === 'yes' && (
                <input placeholder="Сколько раз и на какой срок" value={formData.previousAttempts || ''} onChange={(e) => setFormData(prev => ({ ...prev, previousAttempts: e.target.value }))} />
              )}
            </div>

            <div className="question-group">
              <label>Что обычно срывает?</label>
              <input placeholder="Например: стресс, алкоголь" value={formData.commonRelapse || ''} onChange={(e) => setFormData(prev => ({ ...prev, commonRelapse: e.target.value }))} />
            </div>

            <div className="question-group">
              <label>Зачем ты хочешь бросить? (выбери несколько)</label>
              {['здоровье','деньги','спорт','отношения','контроль','другое'].map(r => (
                <label key={r} style={{ display: 'block', marginBottom: 6 }}>
                  <input type="checkbox" checked={(formData.motivations||[]).includes(r)} onChange={(e) => {
                    const setM = new Set(formData.motivations||[])
                    if (e.target.checked) setM.add(r); else setM.delete(r)
                    setFormData(prev => ({ ...prev, motivations: Array.from(setM) }))
                  }} /> {r}
                </label>
              ))}
            </div>

            <div className="question-group">
              <label>Насколько ты готов(а) бросить прямо сейчас по шкале 1–10?</label>
              <input type="range" min="1" max="10" value={formData.readiness || 5} onChange={(e) => setFormData(prev => ({ ...prev, readiness: parseInt(e.target.value) }))} />
              <div>Готовность: {formData.readiness || 5}</div>
            </div>

            <div className="question-group">
              <label>Есть ли поддержка?</label>
              <select value={formData.support || 'никто'} onChange={(e) => setFormData(prev => ({ ...prev, support: e.target.value }))}>
                <option value="друзья">друзья</option>
                <option value="партнёр">партнёр</option>
                <option value="никто">никто</option>
              </select>
            </div>

            <div style={{ marginTop: 16 }}>
              <button className="btn-next glass" onClick={() => setShowGeneral(false)}>Продолжить</button>
            </div>
          </div>
        </div>
      )
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
            onClick={() => {
              if ((formData.selectedProducts || []).includes('cigarettes')) {
                setExtraStep('cigarettes')
              } else {
                setStep(2)
              }
            }}
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
          <div style={{ marginTop: 12 }}>
            <button className="back-btn glass" onClick={() => {
              // proceed: if cigarettes selected, open cigarettes extra step
              if ((formData.selectedProducts || []).includes('cigarettes')) {
                setExtraStep('cigarettes')
              } else {
                setStep(2)
              }
            }}>Далее</button>
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
            onClick={() => {
              if ((formData.selectedProducts || []).includes('cigarettes')) {
                setExtraStep('cigarettes')
              } else {
                setStep(2)
              }
            }}
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
          <div style={{ marginTop: 12 }}>
            <button className="back-btn glass" onClick={() => {
              if ((formData.selectedProducts || []).includes('cigarettes')) {
                setExtraStep('cigarettes')
              } else {
                setStep(2)
              }
            }}>Далее</button>
          </div>
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

  // Extra: Cigarettes detailed block
  if (extraStep === 'cigarettes') {
    const c = formData.cigarettes || { daily: formData.currentDaily || 20, binge: false, afterMeal: false, night: false, type: 'обычные', autopilot: false, ritual: 'nicotine' }
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-header">
            <h2>Сигареты — уточняющие вопросы</h2>
            <p>Поможет точнее оценить уровень зависимости</p>
          </div>

          <div className="question-group">
            <label>Сколько сигарет в день в среднем?</label>
            <input type="number" min="1" value={c.daily} onChange={(e) => setFormData(prev => ({ ...prev, cigarettes: { ...(prev.cigarettes||{}), daily: parseInt(e.target.value) } }))} />
          </div>

          <div className="question-group">
            <label>Бывают ли «запои» (20+ в день)?</label>
            <select value={c.binge ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, cigarettes: { ...(prev.cigarettes||{}), binge: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Куришь ли сразу после еды?</label>
            <select value={c.afterMeal ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, cigarettes: { ...(prev.cigarettes||{}), afterMeal: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Куришь ли ночью / просыпаешься ради сигареты?</label>
            <select value={c.night ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, cigarettes: { ...(prev.cigarettes||{}), night: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Какие сигареты?</label>
            <select value={c.type} onChange={(e) => setFormData(prev => ({ ...prev, cigarettes: { ...(prev.cigarettes||{}), type: e.target.value } }))}>
              <option value="лёгкие">лёгкие</option>
              <option value="обычные">обычные</option>
              <option value="крепкие">крепкие</option>
            </select>
          </div>

          <div className="question-group">
            <label>Куришь ли на автомате, не замечая?</label>
            <select value={c.autopilot ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, cigarettes: { ...(prev.cigarettes||{}), autopilot: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Основное удовольствие — никотин или сам ритуал?</label>
            <select value={c.ritual || 'nicotine'} onChange={(e) => setFormData(prev => ({ ...prev, cigarettes: { ...(prev.cigarettes||{}), ritual: e.target.value } }))}>
              <option value="nicotine">Никотин</option>
              <option value="ritual">Ритуал</option>
            </select>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn-next glass" onClick={() => {
              const err = validateCigarettes()
              if (err) return alert(err)
              proceedFromExtra('cigarettes')
            }}>Далее</button>
            <button className="back-btn glass" onClick={() => { proceedFromExtra('cigarettes') }} style={{ marginLeft: 8 }}>Пропустить</button>
          </div>
        </div>
      </div>
    )
  }

  // Extra: POD / vape detailed block
  if (extraStep === 'vape' || extraStep === 'pod') {
    const v = formData.vape || { nicotineType: 'salt', strength: 20, puffs: 200, background: false, inBed: false, unnoticed: false, tasteOverEffect: 'effect' }
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-header">
            <h2>POD / Вейп — уточняющие вопросы</h2>
            <p>Поможет понять реальное потребление никотина</p>
          </div>

          <div className="question-group">
            <label>Тип никотина</label>
            <select value={v.nicotineType} onChange={(e) => setFormData(prev => ({ ...prev, vape: { ...(prev.vape||{}), nicotineType: e.target.value } }))}>
              <option value="salt">солевой</option>
              <option value="regular">обычный</option>
            </select>
          </div>

          <div className="question-group">
            <label>Крепость (мг)</label>
            <input type="number" min="0" value={v.strength} onChange={(e) => setFormData(prev => ({ ...prev, vape: { ...(prev.vape||{}), strength: parseInt(e.target.value) } }))} />
          </div>

          <div className="question-group">
            <label>Приблизительно сколько затяжек в день?</label>
            <input type="number" min="0" value={v.puffs} onChange={(e) => setFormData(prev => ({ ...prev, vape: { ...(prev.vape||{}), puffs: parseInt(e.target.value) } }))} />
          </div>

          <div className="question-group">
            <label>Фоновое парение (почти постоянно)?</label>
            <select value={v.background ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, vape: { ...(prev.vape||{}), background: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Беру ли в кровать?</label>
            <select value={v.inBed ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, vape: { ...(prev.vape||{}), inBed: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Не замечаешь, как долго паришь?</label>
            <select value={v.unnoticed ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, vape: { ...(prev.vape||{}), unnoticed: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Что важнее — вкус или эффект?</label>
            <select value={v.tasteOverEffect} onChange={(e) => setFormData(prev => ({ ...prev, vape: { ...(prev.vape||{}), tasteOverEffect: e.target.value } }))}>
              <option value="effect">Эффект</option>
              <option value="taste">Вкус</option>
            </select>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn-next glass" onClick={() => {
              const err = validateVape()
              if (err) return alert(err)
              proceedFromExtra('vape')
            }}>Далее</button>
            <button className="back-btn glass" onClick={() => proceedFromExtra('vape')} style={{ marginLeft: 8 }}>Пропустить</button>
          </div>
        </div>
      </div>
    )
  }

  // Extra: IQOS / GLO
  if (extraStep === 'iqos' || extraStep === 'glo') {
    const i = formData.iqos || { sticks: 10, consecutive: false, homeMore: false, harmless: false, increasedDependence: false }
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-header">
            <h2>IQOS / GLO — уточняющие вопросы</h2>
          </div>

          <div className="question-group">
            <label>Сколько стиков в день?</label>
            <input type="number" min="0" value={i.sticks} onChange={(e) => setFormData(prev => ({ ...prev, iqos: { ...(prev.iqos||{}), sticks: parseInt(e.target.value) } }))} />
          </div>

          <div className="question-group">
            <label>Куришь ли подряд 2–3 стика?</label>
            <select value={i.consecutive ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, iqos: { ...(prev.iqos||{}), consecutive: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Куришь ли дома чаще, чем сигареты раньше?</label>
            <select value={i.homeMore ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, iqos: { ...(prev.iqos||{}), homeMore: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div className="question-group">
            <label>Есть ли ощущение, что это «безвредно»?</label>
            <select value={i.harmless ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, iqos: { ...(prev.iqos||{}), harmless: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn-next glass" onClick={() => {
              const err = validateIqos()
              if (err) return alert(err)
              proceedFromExtra('iqos')
            }}>Далее</button>
            <button className="back-btn glass" onClick={() => proceedFromExtra('iqos')} style={{ marginLeft: 8 }}>Пропустить</button>
          </div>
        </div>
      </div>
    )
  }

  // Extra: Snus
  if (extraStep === 'snus') {
    const s = formData.snus || { strength: 6, pouches: 5, keepLong: false, sleepWith: false, irritability: false }
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-header"><h2>Снюс / паучи</h2></div>
          <div className="question-group">
            <label>Крепость (мг)</label>
            <input type="number" min="0" value={s.strength} onChange={(e) => setFormData(prev => ({ ...prev, snus: { ...(prev.snus||{}), strength: parseInt(e.target.value) } }))} />
          </div>
          <div className="question-group">
            <label>Сколько паучей в день?</label>
            <input type="number" min="0" value={s.pouches} onChange={(e) => setFormData(prev => ({ ...prev, snus: { ...(prev.snus||{}), pouches: parseInt(e.target.value) } }))} />
          </div>
          <div className="question-group">
            <label>Держишь ли дольше рекомендованного?</label>
            <select value={s.keepLong ? 'yes' : 'no'} onChange={(e) => setFormData(prev => ({ ...prev, snus: { ...(prev.snus||{}), keepLong: e.target.value === 'yes' } }))}>
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn-next glass" onClick={() => {
              const err = validateSnus()
              if (err) return alert(err)
              proceedFromExtra('snus')
            }}>Далее</button>
            <button className="back-btn glass" onClick={() => proceedFromExtra('snus')} style={{ marginLeft: 8 }}>Пропустить</button>
          </div>
        </div>
      </div>
    )
  }

  // Extra: Hookah
  if (extraStep === 'hookah') {
    const h = formData.hookah || { frequency: 'monthly', alone: false, sessionHours: 1, cravingOutside: false }
    return (
      <div className="quit-plan-container">
        <div className="plan-card glass">
          <div className="plan-header"><h2>Кальян</h2></div>
          <div className="question-group">
            <label>Как часто?</label>
            <select value={h.frequency} onChange={(e) => setFormData(prev => ({ ...prev, hookah: { ...(prev.hookah||{}), frequency: e.target.value } }))}>
              <option value="monthly">раз в месяц</option>
              <option value="weekly">недельно</option>
              <option value="more">чаще</option>
            </select>
          </div>
          <div className="question-group">
            <label>Куришь ли один или в компании?</label>
            <select value={h.alone ? 'alone' : 'group'} onChange={(e) => setFormData(prev => ({ ...prev, hookah: { ...(prev.hookah||{}), alone: e.target.value === 'alone' } }))}>
              <option value="group">в компании</option>
              <option value="alone">один</option>
            </select>
          </div>
          <div className="question-group">
            <label>Затягивается ли сессия на часы?</label>
            <select value={h.sessionHours > 1 ? 'long' : 'short'} onChange={(e) => setFormData(prev => ({ ...prev, hookah: { ...(prev.hookah||{}), sessionHours: e.target.value === 'long' ? 3 : 1 } }))}>
              <option value="short">короткая</option>
              <option value="long">длинная</option>
            </select>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn-next glass" onClick={() => { const err = validateHookah(); if (err) return alert(err); proceedFromExtra('hookah') }}>Далее</button>
            <button className="back-btn glass" onClick={() => proceedFromExtra('hookah')} style={{ marginLeft: 8 }}>Пропустить</button>
          </div>
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
              <div className="label">Категории</div>
              <div className="value">{(calculatedPlan.selectedProducts || formData.selectedProducts || []).map(k => PRODUCT_TYPES[k]?.name || k).join(', ')}</div>
            </div>
            <div className="summary-item">
              <div className="label">Триггеры</div>
              <div className="value">{(calculatedPlan.triggers || formData.triggers || []).join(', ') || '—'}</div>
            </div>
            <div className="summary-item">
              <div className="label">Мотивация</div>
              <div className="value">{(calculatedPlan.motivations || formData.motivations || []).join(', ') || '—'}</div>
            </div>
            <div className="summary-item">
              <div className="label">Поддержка</div>
              <div className="value">{calculatedPlan.support || formData.support || '—'}</div>
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
                  const payload = { ...calculatedPlan, selectedProducts: formData.selectedProducts, triggers: formData.triggers, motivations: formData.motivations, support: formData.support }
                  onSavePlan(payload)
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
