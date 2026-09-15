import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getConversation } from '../../services/messages'
import { uploadFile } from '../../services/files'
import { deriveConversationKey, encryptMessage, decryptMessage, hashMessage } from '../../utils/crypto'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ selectedUser, wsRef, onlineUsers = [], searchedMessageId = null }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [decryptedMessages, setDecryptedMessages] = useState({})
  const [input, setInput] = useState('')
  const [aesKey, setAesKey] = useState(null)
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimerRef = useRef(null)
  const fileInputRef = useRef(null)
  const aesKeyRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!selectedUser) return
    setupEncryption()
    loadMessages()
  }, [selectedUser])

  const setupEncryption = async () => {
    const key = await deriveConversationKey(user.id, selectedUser.id)
    setAesKey(key)
    aesKeyRef.current = key
  }

  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await getConversation(selectedUser.id)
      setMessages(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!aesKey || messages.length === 0) return
    decryptAll()
  }, [messages, aesKey])

  const decryptAll = async () => {
    const decrypted = {}
    for (const msg of messages) {
      try {
        decrypted[msg.id] = await decryptMessage(msg.encrypted_content, msg.iv, aesKey)
      } catch {
        decrypted[msg.id] = '[Pesan terenkripsi]'
      }
    }
    setDecryptedMessages(decrypted)
  }

  useEffect(() => { scrollToBottom() }, [messages, decryptedMessages])

  // Scroll dan highlight ke pesan yang dicari
  useEffect(() => {
    if (!searchedMessageId) return
    setTimeout(() => {
      const el = document.getElementById(`msg-${searchedMessageId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.style.transition = 'background-color 0.3s'
        el.style.backgroundColor = 'rgba(234, 179, 8, 0.2)'
        setTimeout(() => { el.style.backgroundColor = '' }, 2000)
      }
    }, 600)
  }, [searchedMessageId, decryptedMessages])

  const handleWSMessage = useCallback(async (data) => {
    if (data.type === 'message' && data.sender_id === selectedUser?.id) {
      const newMsg = {
        id: data.id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        encrypted_content: data.encrypted_content,
        iv: data.iv,
        message_type: data.message_type || 'text',
        message_hash: data.message_hash,
        file_url: data.file_url,
        file_name: data.file_name,
        created_at: data.created_at,
        status: 'delivered'
      }
      setMessages(prev => [...prev, newMsg])
      setOtherTyping(false)
      try {
        const key = aesKeyRef.current
        if (key) {
          const plaintext = await decryptMessage(data.encrypted_content, data.iv, key)
          setDecryptedMessages(prev => ({ ...prev, [data.id]: plaintext }))
        }
      } catch {
        setDecryptedMessages(prev => ({ ...prev, [data.id]: '[Pesan terenkripsi]' }))
      }
    }
    if (data.type === 'typing' && data.sender_id === selectedUser?.id) {
      setOtherTyping(data.is_typing)
    }
  }, [selectedUser])

  useEffect(() => {
    if (wsRef) wsRef.current.onMessage = handleWSMessage
  }, [handleWSMessage, wsRef])

  const handleSend = async () => {
    if (!input.trim() || !aesKey || !wsRef?.current?.send) return
    const plaintext = input.trim()
    setInput('')
    try {
      const { encrypted_content, iv } = await encryptMessage(plaintext, aesKey)
      const msgHash = await hashMessage(plaintext)
      wsRef.current.send({
        type: 'message',
        receiver_id: selectedUser.id,
        encrypted_content,
        iv,
        message_type: 'text',
        message_hash: msgHash
      })
      const tempId = Date.now().toString()
      setMessages(prev => [...prev, {
        id: tempId,
        sender_id: user.id,
        receiver_id: selectedUser.id,
        encrypted_content,
        iv,
        message_type: 'text',
        message_hash: msgHash,
        created_at: new Date().toISOString(),
        status: 'sent'
      }])
      setDecryptedMessages(prev => ({ ...prev, [tempId]: plaintext }))
    } catch (e) {
      console.error('Gagal mengirim pesan:', e)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !wsRef?.current?.send) return
    try {
      const res = await uploadFile(file)
      const { file_url, file_name, file_size } = res.data
      const placeholder = `[File: ${file_name}]`
      const { encrypted_content, iv } = await encryptMessage(placeholder, aesKey)
      wsRef.current.send({
        type: 'message',
        receiver_id: selectedUser.id,
        encrypted_content,
        iv,
        message_type: 'file',
        file_url,
        file_name,
        file_size
      })
    } catch (e) {
      console.error('Upload gagal:', e)
    }
  }

  const handleTyping = (e) => {
    setInput(e.target.value)
    if (!typing) {
      setTyping(true)
      wsRef?.current?.send({ type: 'typing', receiver_id: selectedUser.id, is_typing: true })
    }
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      setTyping(false)
      wsRef?.current?.send({ type: 'typing', receiver_id: selectedUser.id, is_typing: false })
    }, 1500)
  }

  const isOnline = onlineUsers.includes(selectedUser?.id)

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-pastel">
        <div className="text-center text-burgundy-400">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-lg font-medium text-burgundy-500">Pilih percakapan</p>
          <p className="text-sm mt-1">Semua pesan dienkripsi end-to-end</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-pastel text-burgundy-500">
      <div className="flex items-center gap-3 px-4 py-3 bg-butter border-b border-burgundy-500/20">
        <div className="relative">
          {selectedUser.avatar_url ? (
            <img src={selectedUser.avatar_url} alt={selectedUser.username}
              className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-burgundy-500 rounded-full flex items-center justify-center text-butter font-medium">
              {selectedUser.username?.[0]?.toUpperCase()}
            </div>
          )}
          {isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-burgundy-500 rounded-full border-2 border-butter" />}
        </div>
        <div>
          <p className="text-burgundy-500 font-medium text-sm">{selectedUser.full_name || selectedUser.username}</p>
          <p className="text-burgundy-400 text-xs">{isOnline ? '🟢 Online' : '⚫ Offline'}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-burgundy-400 text-xs">
          <span>🔒</span>
          <span>End-to-End Encrypted</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="text-center text-burgundy-400 py-8">Memuat pesan...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-burgundy-400 py-8 text-sm">
            <p>Belum ada pesan</p>
            <p className="text-xs mt-1 text-burgundy-400">Pesan kamu dienkripsi AES-256</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} id={`msg-${msg.id}`} className="rounded-lg transition-colors duration-500">
              <MessageBubble
                message={msg}
                decryptedContent={decryptedMessages[msg.id]}
                isOwn={msg.sender_id === user.id}
              />
            </div>
          ))
        )}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-butter rounded-2xl px-4 py-2 text-burgundy-400 text-sm">
              <span className="animate-pulse">mengetik...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 py-3 bg-butter border-t border-burgundy-500/20">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="text-burgundy-400 hover:text-burgundy-500 p-2 transition-colors" title="Lampirkan file">
            📎
          </button>
          <input type="text" value={input} onChange={handleTyping}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Tulis pesan terenkripsi..."
            className="flex-1 bg-butter text-burgundy-500 rounded-xl px-4 py-2.5 text-sm border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500" />
          <button onClick={handleSend} disabled={!input.trim()}
            className="bg-burgundy-500 hover:bg-burgundy-400 disabled:opacity-40 text-butter p-2.5 rounded-xl transition-colors">
            ➤
          </button>
        </div>
        <p className="text-burgundy-400 text-xs mt-1 text-center">🔒 Dienkripsi AES-256-CBC</p>
      </div>
    </div>
  )
}