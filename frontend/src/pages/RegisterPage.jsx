import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkUsername, register as registerApi } from '../services/auth'
import { LockKeyhole } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState('idle')
  const navigate = useNavigate()
  const usernameTaken = usernameStatus === 'taken' || error.toLowerCase().includes('username')
  const passwordTooShort = form.password.length > 0 && form.password.length < 8

  useEffect(() => {
    const username = form.username.trim()
    if (username.length < 3) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsername(username)
        setUsernameStatus(res.data.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 450)

    return () => clearTimeout(timer)
  }, [form.username])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    if (usernameStatus === 'taken') {
      setError('Username telah terdaftar')
      return
    }
    setLoading(true)
    try {
      await registerApi(form)
      navigate('/login?registered=1')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registrasi gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pastel flex items-start sm:items-center justify-center p-4 sm:p-6 text-burgundy-500 overflow-y-auto">
      <div className="bg-butter rounded-2xl p-5 sm:p-8 w-full max-w-md border border-burgundy-500/20">
        <div className="text-center mb-8">
          <LockKeyhole size={40} strokeWidth={1.8} className="mx-auto mb-3 text-burgundy-500" />
          <h1 className="text-2xl font-bold text-burgundy-500">Daftar Akun</h1>
          <p className="text-burgundy-400 text-sm mt-1">Buat akun baru</p>
        </div>

        {error && (
          <div className="bg-burgundy-500/10 border border-burgundy-500/30 text-burgundy-500 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Nama Lengkap</label>
            <input type="text" value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500"
              placeholder="Masukkan nama lengkap" />
          </div>
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Username *</label>
            <input type="text" value={form.username} required
              onChange={e => {
                setError('')
                setForm({ ...form, username: e.target.value })
              }}
              className={`w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border focus:outline-none ${usernameTaken ? 'border-red-500 focus:border-red-500' : 'border-burgundy-500/30 focus:border-burgundy-500'}`}
              placeholder="Buat username" minLength={3} />
            {usernameTaken && (
              <p className="text-red-600 text-xs mt-1.5">Username telah terdaftar</p>
            )}
            {usernameStatus === 'available' && (
              <p className="text-green-600 text-xs mt-1.5">Username tersedia</p>
            )}
            {usernameStatus === 'checking' && (
              <p className="text-burgundy-400 text-xs mt-1.5">Memeriksa username...</p>
            )}
          </div>
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Email *</label>
            <input type="email" value={form.email} required
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500"
              placeholder="Masukkan alamat email" />
          </div>
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Password *</label>
            <input type="password" value={form.password} required
              onChange={e => setForm({ ...form, password: e.target.value })}
              className={`w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border focus:outline-none ${passwordTooShort ? 'border-red-500 focus:border-red-500' : 'border-burgundy-500/30 focus:border-burgundy-500'}`}
              placeholder="Buat password minimal 8 karakter" minLength={8} />
            {passwordTooShort && (
              <p className="text-red-600 text-xs mt-1.5">
                Password masih kurang {8 - form.password.length} karakter
              </p>
            )}
            {form.password.length >= 8 && (
              <p className="text-green-600 text-xs mt-1.5">Password sudah memenuhi minimal 8 karakter</p>
            )}
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-burgundy-500 hover:bg-burgundy-400 disabled:bg-burgundy-600 text-butter font-medium py-3 rounded-lg transition-colors">
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-burgundy-400 text-sm mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-burgundy-500 hover:text-burgundy-400 font-bold">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
