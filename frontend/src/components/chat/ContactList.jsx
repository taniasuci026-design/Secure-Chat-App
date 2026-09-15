import { useState, useEffect, useCallback } from 'react'
import { getContacts, searchUsers, addContact } from '../../services/users'
import { getConversations, getAllMessages } from '../../services/messages'
import { deriveConversationKey, decryptMessage } from '../../utils/crypto'
import { useAuth } from '../../context/AuthContext'

export default function ContactList({ selectedUser, onSelectUser, onlineUsers = [] }) {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [conversations, setConversations] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [tab, setTab] = useState('chats')
  const [addUsername, setAddUsername] = useState('')
  const [addMsg, setAddMsg] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [convRes, contactRes] = await Promise.all([getConversations(), getContacts()])
      setConversations(convRes.data)
      setContacts(contactRes.data)
    } catch (e) { console.error(e) }
  }

  const handleSearch = async (q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); return }

    if (tab === 'chats') {
      setSearching(true)
      try {
        const res = await getAllMessages()
        const allMessages = res.data
        const results = []

        for (const msg of allMessages) {
          try {
            const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
            const key = await deriveConversationKey(user.id, otherId)
            const plaintext = await decryptMessage(msg.encrypted_content, msg.iv, key)

            if (plaintext.toLowerCase().includes(q.toLowerCase())) {
              const conv = conversations.find(c => c.user?.id === otherId)
              if (conv?.user) {
                results.push({
                  user: conv.user,
                  message: plaintext,
                  messageId: msg.id,
                  created_at: msg.created_at,
                  is_own: msg.sender_id === user.id
                })
              }
            }
          } catch {}
        }

        const seen = new Set()
        const unique = results.filter(r => {
          if (seen.has(r.user.id)) return false
          seen.add(r.user.id)
          return true
        })

        setSearchResults(unique)
      } catch (e) {
        console.error(e)
      } finally {
        setSearching(false)
      }
    } else {
      try {
        const res = await searchUsers(q)
        setSearchResults(res.data.map(u => ({ user: u })))
      } catch {}
    }
  }

  const handleAddContact = async () => {
    if (!addUsername.trim()) return
    try {
      await addContact(addUsername.trim())
      setAddMsg('Kontak berhasil ditambahkan')
      setAddUsername('')
      loadData()
    } catch (err) {
      setAddMsg(err.response?.data?.detail || 'Gagal menambahkan kontak')
    }
    setTimeout(() => setAddMsg(''), 3000)
  }

  const isSearching = searchQuery.trim().length > 0
  let displayItems = []

  if (isSearching) {
    displayItems = searchResults
  } else if (tab === 'chats') {
    displayItems = conversations.map(c => ({ user: c.user, unread: c.unread_count }))
  } else {
    displayItems = contacts.map(c => ({ user: c.contact }))
  }

  return (
    <div className="flex flex-col h-full bg-pastel text-burgundy-500">
      <div className="p-4 border-b border-burgundy-500/20">
        <h1 className="text-burgundy-500 font-bold text-2xl mb-3">Secure Chat</h1>
        <input type="text" placeholder="Cari pesan..." value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          className="w-full bg-butter text-burgundy-500 rounded-lg px-3 py-2 text-sm border border-burgundy-500/20 focus:outline-none focus:border-burgundy-500 placeholder-burgundy-400" />
      </div>

      {!isSearching && (
        <div className="flex border-b border-burgundy-500/20">
          {['chats', 'contacts'].map(t => (
            <button key={t} onClick={() => { setTab(t); setSearchQuery('') }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${tab === t ? 'text-burgundy-500 border-b-2 border-burgundy-500' : 'text-burgundy-400 hover:text-burgundy-500'}`}>
              {t === 'chats' ? 'Chat' : 'Kontak'}
            </button>
          ))}
        </div>
      )}

      {!isSearching && tab === 'contacts' && (
        <div className="p-3 border-b border-burgundy-500/20">
          <input type="text" placeholder="Ketik username lalu Enter..."
            value={addUsername}
            onChange={e => setAddUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddContact()}
            className="w-full bg-butter text-burgundy-500 rounded-lg px-3 py-1.5 text-xs border border-burgundy-500/20 focus:outline-none focus:border-burgundy-500" />
          {addMsg && <p className="text-xs mt-1 text-burgundy-400">{addMsg}</p>}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {searching ? (
          <div className="p-4 text-burgundy-400 text-sm text-center animate-pulse">
            Mencari pesan...
          </div>
        ) : displayItems.length === 0 ? (
          <div className="p-4 text-burgundy-400 text-sm text-center">
            {isSearching ? 'Pesan tidak ditemukan' : tab === 'chats' ? 'Belum ada percakapan' : 'Belum ada kontak'}
          </div>
        ) : (
          displayItems.map((item, idx) => {
            const u = item.user
            if (!u) return null
            const conv = conversations.find(c => c.user?.id === u.id)
            const isOnline = onlineUsers.includes(u.id)
            const isSelected = selectedUser?.id === u.id
            return (
              <button key={u.id || idx}
                onClick={() => { onSelectUser(u, item.messageId); setSearchQuery('') }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-butter transition-colors text-left ${isSelected ? 'bg-butter border-l-2 border-burgundy-500' : ''}`}>
                <div className="relative flex-shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.username}
                      className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-burgundy-500 rounded-full flex items-center justify-center text-butter font-medium text-sm">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-burgundy-500 rounded-full border-2 border-pastel" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-burgundy-500 text-sm font-medium truncate">{u.full_name || u.username}</p>
                    {!isSearching && conv?.unread_count > 0 && (
                      <span className="bg-burgundy-500 text-butter text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  {isSearching && item.message ? (
                    <p className="text-burgundy-400 text-xs truncate">
                      {item.is_own ? 'Kamu: ' : ''}{item.message}
                    </p>
                  ) : (
                    <p className="text-burgundy-400 text-xs truncate">@{u.username}</p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}