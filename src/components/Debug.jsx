import React, { useState, useEffect } from 'react'

export default function Debug() {
  const [storage, setStorage] = useState({})
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const data = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      try {
        data[key] = JSON.parse(value)
      } catch (e) {
        data[key] = value
      }
    }
    setStorage(data)
  }, [refreshKey])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 DEBUG: localStorage</h1>
      <button 
        onClick={() => setRefreshKey(k => k + 1)}
        style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}
      >
        🔄 Обновить
      </button>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', maxHeight: '80vh', overflow: 'auto' }}>
        {Object.keys(storage).length === 0 ? (
          <p>localStorage пуст</p>
        ) : (
          Object.entries(storage).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
              <strong style={{ color: '#d32f2f' }}>📍 {key}</strong>
              <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '300px' }}>
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
        <p>📊 Итого: {Object.keys(storage).length} ключей</p>
        <p>👤 Пользователей (qs_user_*): {
          Object.keys(storage).filter(k => k.startsWith('qs_user_') && !k.includes('_id')).length
        }</p>
        <p>🗂️ qs_users: {
          storage.qs_users ? (Array.isArray(storage.qs_users) ? storage.qs_users.length : '❌ не массив') : '❌ не найден'
        }</p>
      </div>
    </div>
  )
}
