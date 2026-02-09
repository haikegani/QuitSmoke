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
          
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev =>
              prev.map(msg => msg.id === payload.new.id ? payload.new : msg)
            )
          }
        }
      )
      .subscribe()

    subscriptionRef.current = subscription
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
      setShowNewChat(false)
      setSelectedFriend(null)
      onChatOpened?.()
    }
  }, [selectedChatUser, user?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Отправляем сообщение в Supabase
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return

    setLoading(true)

    try {
      const receiverId = selectedChat.participantIds.find(id => id !== user.id)
      const receiverEmail = selectedChat.participants.find(email => email !== user.email)

      console.log('[CHATS] Отправляем сообщение в', receiverEmail)

      const { error } = await supabase
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
          {messages.length > 0 && selectedChat && (
            <button
              className={`chat-item active`}
              onClick={() => {}}
            >
              <div className="chat-avatar" style={{ background: '#667eea' }}>
                {selectedChat.participantNames[1]?.slice(0, 2).toUpperCase()}
              </div>
              <div className="chat-info">
                <div className="chat-name">
                  {selectedChat.participantNames[1]}
                </div>
                <div className="chat-preview">
                  {messages.length > 0
                    ? messages[messages.length - 1].text.slice(0, 30) + (messages[messages.length - 1].text.length > 30 ? '...' : '')
                    : 'Нет сообщений'}
                </div>
              </div>
            </button>
          )}

          {messages.length === 0 && selectedChat && (
            <div className="empty-chats">
              <p>Начни беседу</p>
            </div>
          )}
        </div>
      </div>

      <div className="chat-view">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-title">{selectedChat.participantNames[1]}</div>
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
          <div className="no-chat-selected">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p>Выберите пользователя или начните новый чат</p>
          </div>
        )}
      </div>
    </div>
  )
}
