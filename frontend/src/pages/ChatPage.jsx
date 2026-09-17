import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { MessageCircle, UserRound } from 'lucide-react'
import ContactList from '../components/chat/ContactList'
import ChatWindow from '../components/chat/ChatWindow'
import ProfilePage from './ProfilePage'

export default function ChatPage() {
  const { user } = useAuth()
  const [selectedUser, setSelectedUser] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [activeTab, setActiveTab] = useState('chat')
  const [searchedMessageId, setSearchedMessageId] = useState(null)
  const chatWindowRef = useRef({ onMessage: null, send: null })

  const handleWSMessage = useCallback((data) => {
    if (data.type === 'user_online') {
      setOnlineUsers(prev => [...new Set([...prev, data.user_id])])
    } else if (data.type === 'user_offline') {
      setOnlineUsers(prev => prev.filter(id => id !== data.user_id))
    } else if (chatWindowRef.current?.onMessage) {
      chatWindowRef.current.onMessage(data)
    }
  }, [])

  const { send, ping } = useWebSocket(user?.id, handleWSMessage)

  useEffect(() => {
    chatWindowRef.current.send = send
  }, [send])

  useEffect(() => {
    const interval = setInterval(ping, 30000)
    return () => clearInterval(interval)
  }, [ping])

  const handleSelectUser = (u, messageId = null) => {
    setSelectedUser(u)
    setSearchedMessageId(messageId)
    setActiveTab('chat')
  }

  const handleBackToContacts = () => {
    setSelectedUser(null)
    setActiveTab('chat')
  }

  return (
    <div className="h-screen flex bg-pastel text-burgundy-500 overflow-hidden">
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-72 flex-shrink-0 flex-col border-r border-burgundy-500/20`}>
        {activeTab === 'chat' ? (
          <ContactList
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            onlineUsers={onlineUsers}
          />
        ) : (
          <ProfilePage />
        )}
        <div className="flex border-t border-burgundy-500/20 bg-pastel">
          <button onClick={() => { setSelectedUser(null); setActiveTab('chat') }} aria-label="Buka chat" title="Chat"
            className={`flex-1 py-3 text-sm transition-colors ${activeTab === 'chat' ? 'text-burgundy-500' : 'text-burgundy-400 hover:text-burgundy-500'}`}>
            <MessageCircle size={20} strokeWidth={2} className="mx-auto" />
          </button>
          <button onClick={() => { setSelectedUser(null); setActiveTab('profile') }} aria-label="Buka profil" title="Profil"
            className={`flex-1 py-3 text-sm transition-colors ${activeTab === 'profile' ? 'text-burgundy-500' : 'text-burgundy-400 hover:text-burgundy-500'}`}>
            <UserRound size={20} strokeWidth={2} className="mx-auto" />
          </button>
        </div>
      </div>

      <ChatWindow
        selectedUser={selectedUser}
        onBack={handleBackToContacts}
        wsRef={chatWindowRef}
        onlineUsers={onlineUsers}
        searchedMessageId={searchedMessageId}
      />
    </div>
  )
}