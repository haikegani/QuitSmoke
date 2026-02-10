import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Chats.css'

export default function Chats({ user, friends, selectedChatUser, onChatOpened }) {
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)

  // Вычисляем чат ID из двух email'ов
  const getChatId = (email1, email2) => {
    return [email1, email2].sort().join('_')
  }

  // Загружаем сообщения из Supabase
  const loadMessages = async (chatId) => {
    if (!chatId) return

    try {
      console.log('[CHATS] Загружаем сообщения для чата:', chatId)
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) {
        console.warn('⚠️ Таблица messages еще не создана')
        return
      }

      console.log('✓ Загружено сообщений:', data?.length || 0)
      setMessages(data || [])
    } catch (err) {
      console.error('❌ Ошибка при загрузке сообщений:', err)
    }
  }

  // Загружаем список чатов (по последним сообщениям)
  const loadChats = async () => {
    if (!user?.email) return

    try {
      // Supabase .or sometimes causes bad requests in some environments.
      // Выполним два запроса и объединим результаты вручную (sender || receiver)
      const [resSender, resReceiver] = await Promise.all([
        supabase.from('messages').select('*').eq('sender_email', user.email).order('created_at', { ascending: false }),
        supabase.from('messages').select('*').eq('receiver_email', user.email).order('created_at', { ascending: false })
      ])

      const senderData = resSender.data || []
      const receiverData = resReceiver.data || []
      const combined = [...senderData, ...receiverData]

      // Берём по каждому chat_id самое последнее сообщение (по created_at desc)
      const map = new Map()
      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      combined.forEach(msg => {
        if (!map.has(msg.chat_id)) {
          const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email
          // Пытаемся найти имя в списке friends, иначе берём доступное поле в сообщении, иначе email
          const friendObj = (friends || []).find(f => f.email === otherEmail)
          const otherName = friendObj?.name || friendObj?.username || (msg.sender_email === user.email ? msg.receiver_username : msg.sender_username) || otherEmail.split('@')[0]
          map.set(msg.chat_id, {
            id: msg.chat_id,
            lastMessage: msg.text,
            lastAt: msg.created_at,
            participants: [user.email, otherEmail],
            participantIds: [msg.sender_id, msg.receiver_id],
            participantNames: [user.username || user.email.split('@')[0], otherName]
          })
        }
      })

      const arr = Array.from(map.values())
      setChats(arr)
      console.log('[CHATS] Загружен список чатов:', arr.length, arr.map(c => c.id))
    } catch (err) {
      console.error('[CHATS] Ошибка при загрузке списка чатов:', err)
    }
  }

  // Подписываемся на real-time обновления сообщений
  const subscribeToMessages = (chatId) => {
    if (!chatId) return

    console.log('[CHATS] Подписываемся на обновления:', chatId)

    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
    }

    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('[CHATS] Real-time обновление:', payload.eventType)
          // При появлении/обновлении сообщения перезагружаем список сообщений
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            loadMessages(chatId)
          }
        }
      )
      .subscribe()

    subscriptionRef.current = subscription
    console.log('[CHATS] subscriptionRef set')
  }

  // При выборе чата - загружаем сообщения
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id)
      subscribeToMessages(selectedChat.id)
    }

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
    }
  }, [selectedChat?.id])

  useEffect(() => {
    console.log('[CHATS] mounted or user changed:', user?.email)
  }, [user?.email])

  // При выборе пользователя из поиска - открываем/создаем чат
  useEffect(() => {
    if (selectedChatUser && user) {
      const chatId = getChatId(user.email, selectedChatUser.email)
      const friendName = selectedChatUser.name || selectedChatUser.username || selectedChatUser.email.split('@')[0]
      
      const newChat = {
        id: chatId,
        participants: [user.email, selectedChatUser.email],
        participantIds: [user.id, selectedChatUser.id],
        participantNames: [user.username || user.email.split('@')[0], friendName],
        createdAt: new Date().toISOString()
      }

      setSelectedChat(newChat)
      // Добавим чат в список сразу, если его ещё нет
      setChats(prev => {
        if (prev.find(c => c.id === newChat.id)) return prev
        return [newChat, ...prev]
      })
      setShowNewChat(false)
      setSelectedFriend(null)
      onChatOpened?.()
    }
  }, [selectedChatUser, user?.id])

  // detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const getOtherForChat = (chat) => {
    if (!chat) return { email: '', name: '' }
    const otherEmail = (chat.participants && chat.participants.find(e => e !== user.email)) || (chat.participantEmail) || ''
    const friendObj = (friends || []).find(f => f.email === otherEmail)
    const name = friendObj?.name || friendObj?.username || (chat.participantNames && chat.participantNames.find(n => n !== (user.username || user.email.split('@')[0]))) || otherEmail.split('@')[0]
    return { email: otherEmail, name }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Загружаем список чатов при старте и при изменениях сообщений
  useEffect(() => {
    loadChats()
  }, [user?.email])

  // Глобальная подписка для обновления списка чатов при входящих/исходящих сообщениях
  useEffect(() => {
    if (!user?.email) return

    const channel = supabase
      .channel('messages:global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          if (!newMsg) return

          if (newMsg.sender_email === user.email || newMsg.receiver_email === user.email) {
            // Обновим список чатов
            loadChats()

            // Если сообщение для текущего открытого чата — перезагрузим её содержимое
            if (selectedChat && newMsg.chat_id === selectedChat.id) {
              loadMessages(selectedChat.id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch (e) {}
    }
  }, [user?.email, selectedChat?.id])

  // Polling fallback: если WebSocket/Realtime не работает, будем опрашивать список чатов каждые 8s
  useEffect(() => {
    if (!user?.email) return
    const id = setInterval(() => {
      loadChats()
    }, 8000)

    return () => clearInterval(id)
  }, [user?.email])

  // Отправляем сообщение в Supabase
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return

    setLoading(true)

    try {
      const receiverId = selectedChat.participantIds.find(id => id !== user.id)
      const receiverEmail = selectedChat.participants.find(email => email !== user.email)

      console.log('[CHATS] Отправляем сообщение в', receiverEmail)

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          sender_email: user.email,
          sender_username: user.username || user.email.split('@')[0],
          receiver_id: receiverId,
          receiver_email: receiverEmail,
          text: messageText.trim(),
          reactions: []
        })

      if (error) throw error

      // Обновляем сообщения и список чатов из базы (надёжно показать сразу)
      try { await loadMessages(selectedChat.id) } catch (e) {}
      try { await loadChats() } catch (e) {}

      console.log('✓ Сообщение отправлено')
      setMessageText('')
    } catch (err) {
      console.error('❌ Ошибка при отправке сообщения:', err)
      alert('Ошибка при отправке: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Обновляем reactions на сообщение
  const addReaction = async (messageId, emoji) => {
    try {
      const message = messages.find(m => m.id === messageId)
      if (!message) return

      const reactions = message.reactions || []
      const existingIndex = reactions.findIndex(r => r.emoji === emoji && r.by === user.email)

      let updatedReactions
      if (existingIndex >= 0) {
        updatedReactions = reactions.filter((_, i) => i !== existingIndex)
      } else {
        updatedReactions = [...reactions, { emoji, by: user.email }]
      }

      console.log('[CHATS] Обновляем reactions:', emoji)

      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId)

      if (error) throw error

      console.log('✓ Reactions обновлены')
    } catch (err) {
      console.error('❌ Ошибка при обновлении reactions:', err)
    }
  }

  const startNewChat = (friend) => {
    const chatId = getChatId(user.email, friend.email)
    const friendName = friend.name || friend.username || friend.email.split('@')[0]
    
    const newChat = {
      id: chatId,
      participants: [user.email, friend.email],
      participantIds: [user.id, friend.id],
      participantNames: [user.username || user.email.split('@')[0], friendName],
      createdAt: new Date().toISOString()
    }

    setSelectedChat(newChat)
    setShowNewChat(false)
    setSelectedFriend(null)
  }

  return (
    <div className="chats-container">
      <div className="chats-sidebar">
        <div className="chats-header">
          <h2>💬 Чаты</h2>
          <button className="btn-new-chat" onClick={() => setShowNewChat(!showNewChat)}>
            +
          </button>
        </div>

        {showNewChat && (
          <div className="new-chat-panel">
            <div className="new-chat-label">Выберите пользователя</div>
            <div className="friends-list">
              {friends && friends.length > 0 ? (
                friends.map(friend => (
                  <button
                    key={friend.id}
                    className={`friend-item ${selectedFriend?.id === friend.id ? 'selected' : ''}`}
                    onClick={() => startNewChat(friend)}
                  >
                    <div className="friend-avatar" style={{ background: friend.avatarColor }}>
                      {(friend.name || friend.username || friend.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="friend-name">{friend.name || friend.username || friend.email}</div>
                  </button>
                ))
              ) : (
                <div className="empty-friends">
                  <p>Загружаем пользователей...</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="chats-search">
          <input
            type="text"
            placeholder="Поиск чатов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="chats-list">
          {chats && chats.length > 0 ? (
            chats
              .filter(c => {
                if (!searchTerm) return true
                return c.participantNames[1]?.toLowerCase().includes(searchTerm.toLowerCase()) || (c.lastMessage || '').toLowerCase().includes(searchTerm.toLowerCase())
              })
              .map(chat => (
                <button
                  key={chat.id}
                  className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedChat({
                      id: chat.id,
                      participants: chat.participants,
                      participantIds: chat.participantIds,
                      participantNames: chat.participantNames
                    })
                    setShowNewChat(false)
                  }}
                >
                  <div className="chat-avatar" style={{ background: '#667eea' }}>
                    {chat.participantNames[1]?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name">{chat.participantNames[1]}</div>
                    <div className="chat-preview">{chat.lastMessage ? (chat.lastMessage.slice(0, 30) + (chat.lastMessage.length > 30 ? '...' : '')) : 'Нет сообщений'}</div>
                  </div>
                </button>
              ))
          ) : (
              <div className="empty-chats">
                <p>Начать новый чат</p>
                <button className="btn-start-chat" onClick={() => setShowNewChat(true)}>Начать чат</button>
              </div>
          )}
        </div>
      </div>

      <div className="chat-view">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-title">{getOtherForChat(selectedChat).name}</div>
              <button onClick={() => setSelectedChat(null)} className="close-btn">✕</button>
            </div>

            <div className="messages-container">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.sender_email === user.email ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">
                      {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {message.reactions && message.reactions.length > 0 && (
                    <div className="message-reactions">
                      {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                        const count = message.reactions.filter(r => r.emoji === emoji).length
                        return (
                          <button
                            key={emoji}
                            className="reaction"
                            onClick={() => addReaction(message.id, emoji)}
                            title={`Добавлено: ${count}`}
                          >
                            {emoji} {count > 1 ? count : ''}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <button
                    className="reaction-btn"
                    onClick={() => addReaction(message.id, '👍')}
                    title="Добавить реакцию"
                  >
                    😊
                  </button>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Напишите сообщение..."
                disabled={loading}
              />
              <button onClick={sendMessage} className="btn-send" disabled={loading || !messageText.trim()}>
                {loading ? '⏳' : '➤'}
              </button>
            </div>
          </>
        ) : (
          isMobile ? (
            // mobile: show chats list (or empty state with start button)
            <div className="mobile-chats-list">
              {chats && chats.length > 0 ? (
                <div style={{ width: '100%' }}>
                  {chats.map(chat => (
                    <button
                      key={chat.id}
                      className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedChat({
                          id: chat.id,
                          participants: chat.participants,
                          participantIds: chat.participantIds,
                          participantNames: chat.participantNames
                        })
                      }}
                      style={{ display: 'flex', width: '100%' }}
                    >
                      <div className="chat-avatar" style={{ background: '#667eea' }}>
                        {chat.participantNames[1]?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="chat-info">
                        <div className="chat-name">{chat.participantNames[1]}</div>
                        <div className="chat-preview">{chat.lastMessage ? (chat.lastMessage.slice(0, 30) + (chat.lastMessage.length > 30 ? '...' : '')) : 'Нет сообщений'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <p>Начать новый чат</p>
                  <button className="btn-start-chat" onClick={() => setShowNewChat(true)} style={{ marginTop: 12 }}>Начать чат</button>
                </div>
              )}

              {showNewChat && (
                <div className="new-chat-panel" style={{ marginTop: 16, width: '100%' }}>
                  <div className="new-chat-label">Выберите пользователя</div>
                  <div className="friends-list">
                    {friends && friends.length > 0 ? (
                      friends.map(friend => (
                        <button
                          key={friend.id}
                          className={`friend-item ${selectedFriend?.id === friend.id ? 'selected' : ''}`}
                          onClick={() => startNewChat(friend)}
                        >
                          <div className="friend-avatar" style={{ background: friend.avatarColor }}>{(friend.name || friend.username || friend.email).slice(0, 2).toUpperCase()}</div>
                          <div className="friend-name">{friend.name || friend.username || friend.email}</div>
                        </button>
                      ))
                    ) : (
                      <div className="empty-friends"><p>Загружаем пользователей...</p></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-chat-selected">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <p>Выберите пользователя или начните новый чат</p>
              {chats.length === 0 && (
                <button className="btn-start-chat" onClick={() => setShowNewChat(true)} style={{ marginTop: 12 }}>Начать чат</button>
              )}

              {showNewChat && (
                <div className="new-chat-panel" style={{ marginTop: 16, width: '100%' }}>
                  <div className="new-chat-label">Выберите пользователя</div>
                  <div className="friends-list">
                    {friends && friends.length > 0 ? (
                      friends.map(friend => (
                        <button
                          key={friend.id}
                          className={`friend-item ${selectedFriend?.id === friend.id ? 'selected' : ''}`}
                          onClick={() => startNewChat(friend)}
                        >
                          <div className="friend-avatar" style={{ background: friend.avatarColor }}>{(friend.name || friend.username || friend.email).slice(0, 2).toUpperCase()}</div>
                          <div className="friend-name">{friend.name || friend.username || friend.email}</div>
                        </button>
                      ))
                    ) : (
                      <div className="empty-friends"><p>Загружаем пользователей...</p></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}
