import React, { useState, useRef, useEffect } from 'react'
import './Chats.css'

export default function Chats({ user, friends }) {
  const [chats, setChats] = useState(() => {
    const stored = localStorage.getItem(`qs_chats_${user.id}`)
    return stored ? JSON.parse(stored) : []
  })

  const [selectedChat, setSelectedChat] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [selectedChat])

  const sendMessage = () => {
    if (!messageText.trim() || !selectedChat) return

    const updatedChats = chats.map(chat => {
      if (chat.id === selectedChat.id) {
        return {
          ...chat,
          messages: [
            ...chat.messages,
            {
              id: Date.now().toString(),
              senderEmail: user.email,
              senderUsername: user.username || user.email.split('@')[0],
              text: messageText,
              timestamp: new Date().toISOString(),
              reactions: []
            }
          ],
          updatedAt: new Date().toISOString()
        }
      }
      return chat
    })

    setChats(updatedChats)
    localStorage.setItem(`qs_chats_${user.id}`, JSON.stringify(updatedChats))

    const updated = updatedChats.find(c => c.id === selectedChat.id)
    setSelectedChat(updated)
    setMessageText('')
  }

  const startNewChat = (friend) => {
    const chatId = [user.email, friend.email].sort().join('_')
    const existingChat = chats.find(c => c.id === chatId)

    if (existingChat) {
      setSelectedChat(existingChat)
    } else {
      const newChat = {
        id: chatId,
        participants: [user.email, friend.email],
        participantNames: [user.username || user.email.split('@')[0], friend.name],
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const updated = [newChat, ...chats]
      setChats(updated)
      localStorage.setItem(`qs_chats_${user.id}`, JSON.stringify(updated))
      setSelectedChat(newChat)
    }

    setShowNewChat(false)
    setSelectedFriend(null)
  }

  const addReaction = (messageId, emoji) => {
    if (!selectedChat) return

    const updatedChats = chats.map(chat => {
      if (chat.id === selectedChat.id) {
        return {
          ...chat,
          messages: chat.messages.map(msg => {
            if (msg.id === messageId) {
              const existingReaction = msg.reactions.find(r => r.emoji === emoji && r.by === user.email)
              if (existingReaction) {
                return {
                  ...msg,
                  reactions: msg.reactions.filter(r => !(r.emoji === emoji && r.by === user.email))
                }
              } else {
                return {
                  ...msg,
                  reactions: [...msg.reactions, { emoji, by: user.email }]
                }
              }
            }
            return msg
          })
        }
      }
      return chat
    })

    setChats(updatedChats)
    localStorage.setItem(`qs_chats_${user.id}`, JSON.stringify(updatedChats))
    const updated = updatedChats.find(c => c.id === selectedChat.id)
    setSelectedChat(updated)
  }

  const filteredChats = chats.filter(chat => {
    const names = chat.participantNames.join(' ').toLowerCase()
    return names.includes(searchTerm.toLowerCase())
  })

  const otherParticipant = selectedChat?.participants.find(p => p !== user.email)
  const otherParticipantName = selectedChat?.participantNames.find((_, i) => selectedChat.participants[i] !== user.email)

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
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className="friend-avatar">{(friend.name || friend.username || friend.email).slice(0, 2).toUpperCase()}</div>
                    <div className="friend-name">{friend.name || friend.username || friend.email}</div>
                  </button>
                ))
              ) : (
                <div className="empty-friends">
                  <p>Нету пользователей</p>
                  <p style={{fontSize: '12px', color: '#999', marginTop: '4px'}}>Загружаем...</p>
                </div>
              )}
              {selectedFriend && (
                <button className="btn-start-chat" onClick={() => startNewChat(selectedFriend)}>
                  Начать чат →
                </button>
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
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-avatar">{chat.participantNames[0].slice(0, 2).toUpperCase()}</div>
              <div className="chat-info">
                <div className="chat-name">
                  {chat.participantNames.find(n => n !== (user.username || user.email.split('@')[0]))}
                </div>
                <div className="chat-preview">
                  {chat.messages.length > 0
                    ? chat.messages[chat.messages.length - 1].text.slice(0, 30) + (chat.messages[chat.messages.length - 1].text.length > 30 ? '...' : '')
                    : 'Нет сообщений'}
                </div>
              </div>
            </button>
          ))}

          {filteredChats.length === 0 && (
            <div className="empty-chats">
              <p>Нет чатов</p>
            </div>
          )}
        </div>
      </div>

      <div className="chat-view">
        {selectedChat ? (
          <>
            <div className="chat-header">
              <div className="chat-title">{otherParticipantName}</div>
              <div className="chat-status">Online</div>
            </div>

            <div className="messages-container">
              {selectedChat.messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.senderEmail === user.email ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="message-reactions">
                        {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                          const count = message.reactions.filter(r => r.emoji === emoji).length
                          return (
                            <button
                              key={emoji}
                              className="reaction"
                              onClick={() => addReaction(message.id, emoji)}
                            >
                              {emoji} {count > 1 ? count : ''}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
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
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Напишите сообщение..."
              />
              <button onClick={sendMessage} className="btn-send">
                ↗️
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p>Выберите чат или начните новый</p>
          </div>
        )}
      </div>
    </div>
  )
}
