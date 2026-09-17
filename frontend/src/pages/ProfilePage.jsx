import { useState, useRef } from 'react'
import { CheckCircle2, CircleAlert, KeyRound, Pencil, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateMe, updatePublicKey } from '../services/users'
import { generateRSAKeyPair, exportPublicKey, exportPrivateKey, savePrivateKey } from '../utils/crypto'

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', bio: user?.bio || '' })
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('success')
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null)
  const fileInputRef = useRef(null)

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMsg('File harus berupa gambar')
      setMsgType('error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/files/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      const avatarUrl = `http://localhost:8000${data.file_url}`
      const updateRes = await updateMe({ ...form, avatar_url: avatarUrl })
      setUser(updateRes.data)
      setMsg('Foto profil berhasil diperbarui!')
      setMsgType('success')
    } catch {
      setMsg('Gagal upload foto')
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await updateMe(form)
      setUser(res.data)
      setMsg('Profil berhasil diperbarui!')
      setMsgType('success')
    } catch {
      setMsg('Gagal memperbarui profil')
      setMsgType('error')
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(''), 3000)
    }
  }

  const regenerateKeys = async () => {
    if (!confirm('Regenerasi kunci enkripsi?')) return
    setLoading(true)
    try {
      const keyPair = await generateRSAKeyPair()
      const publicKeyPEM = await exportPublicKey(keyPair)
      const privateKeyPEM = await exportPrivateKey(keyPair)
      savePrivateKey(privateKeyPEM)
      localStorage.removeItem('aesKeys')
      await updatePublicKey(publicKeyPEM)
      setMsg('Kunci enkripsi berhasil diperbarui!')
      setMsgType('success')
    } catch {
      setMsg('Gagal memperbarui kunci')
      setMsgType('error')
    } finally {
      setLoading(false)
    }
  }

  const hasKeys = !!localStorage.getItem('privateKey')

  return (
    <div className="h-full overflow-y-auto bg-pastel p-6 text-burgundy-500">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold text-burgundy-500 mb-6">Profil Saya</h1>

        <div className="bg-butter rounded-xl p-6 mb-4 border border-burgundy-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-burgundy-500/20" />
              ) : (
                <div className="w-20 h-20 bg-burgundy-500 rounded-full flex items-center justify-center text-3xl font-bold text-butter">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-burgundy-500 hover:bg-burgundy-400 rounded-full flex items-center justify-center text-butter text-xs border-2 border-butter">
                <Pencil size={13} strokeWidth={2} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange}
                accept="image/*" className="hidden" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-burgundy-500 font-semibold text-lg">{user?.username}</p>
              <p className="text-burgundy-400 text-sm break-all">{user?.email}</p>
              <button onClick={() => fileInputRef.current?.click()} disabled={loading}
                className="mt-1 text-xs text-burgundy-400 hover:text-burgundy-500">
                {loading ? 'Mengupload...' : 'Ganti foto profil'}
              </button>
            </div>
          </div>

          {msg && (
            <div className={`rounded-lg px-4 py-2 mb-4 text-sm border ${
              msgType === 'success'
                ? 'bg-burgundy-500/10 border-burgundy-500/30 text-burgundy-500'
                : 'bg-burgundy-500/10 border-burgundy-500/30 text-burgundy-500'
            }`}>{msg}</div>
          )}

          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <label className="block text-burgundy-400 text-sm mb-1">Nama Lengkap</label>
              <input type="text" value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-2.5 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500 text-sm" />
            </div>
            <div>
              <label className="block text-burgundy-400 text-sm mb-1">Bio</label>
              <textarea value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-2.5 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500 text-sm resize-none" />
            </div>
            <button type="submit" disabled={loading}
              className="bg-burgundy-500 hover:bg-burgundy-400 text-butter px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>

        <div className="bg-butter rounded-xl p-6 mb-4 border border-burgundy-500/20">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={18} strokeWidth={2} className="text-burgundy-500" />
            <h2 className="text-burgundy-500 font-medium">Kunci Enkripsi (E2EE)</h2>
          </div>
          <div className="flex items-start gap-2 mb-4 text-sm text-burgundy-500">
            {hasKeys ? (
              <CheckCircle2 size={18} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
            ) : (
              <CircleAlert size={18} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
            )}
            <span>{hasKeys ? 'Kunci RSA tersimpan di browser ini' : 'Kunci RSA belum dibuat'}</span>
          </div>
          <p className="text-burgundy-400 text-xs leading-relaxed mb-4">
            Kunci privat disimpan hanya di browser kamu. Server tidak pernah tahu kunci privat kamu.
          </p>
          <button onClick={regenerateKeys} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-burgundy-500/10 border border-burgundy-500/30 hover:bg-burgundy-500/20 text-burgundy-500 px-4 py-2 rounded-lg text-sm disabled:opacity-50">
            <RefreshCw size={16} strokeWidth={2} />
            Regenerasi Kunci Enkripsi
          </button>
        </div>

        <button onClick={logout}
          className="w-full bg-burgundy-500/10 border border-burgundy-500/30 hover:bg-burgundy-500/20 text-burgundy-500 py-3 rounded-xl text-sm">
          Keluar
        </button>
      </div>
    </div>
  )
}