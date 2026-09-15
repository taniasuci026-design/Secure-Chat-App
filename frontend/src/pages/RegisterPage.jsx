import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../services/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter')
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
    <div className="min-h-screen bg-pastel flex items-center justify-center p-4 text-burgundy-500">
      <div className="bg-butter rounded-2xl p-8 w-full max-w-md border border-burgundy-500/20">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
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
              placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Username *</label>
            <input type="text" value={form.username} required
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500"
              placeholder="johndoe" minLength={3} />
          </div>
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Email *</label>
            <input type="email" value={form.email} required
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500"
              placeholder="john@example.com" />
          </div>
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Password *</label>
            <input type="password" value={form.password} required
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500"
              placeholder="Minimal 8 karakter" minLength={8} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-burgundy-500 hover:bg-burgundy-400 disabled:bg-burgundy-600 text-butter font-medium py-3 rounded-lg transition-colors">
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-burgundy-400 text-sm mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-burgundy-500 hover:text-burgundy-400">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
