import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../services/auth'
import { useAuth } from '../context/AuthContext'
import { generateRSAKeyPair, exportPublicKey, exportPrivateKey, savePrivateKey } from '../utils/crypto'
import { updatePublicKey } from '../services/users'
import { LockKeyhole } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi(form)
      const { access_token, user } = res.data

      // Generate RSA key pair untuk E2EE jika belum ada
      if (!localStorage.getItem('privateKey')) {
        const keyPair = await generateRSAKeyPair()
        const publicKeyPEM = await exportPublicKey(keyPair)
        const privateKeyPEM = await exportPrivateKey(keyPair)
        savePrivateKey(privateKeyPEM)
        await updatePublicKey(publicKeyPEM)
        // Panggil dengan token yang baru saja didapat
      }

      login(access_token, user)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pastel flex items-start sm:items-center justify-center p-4 sm:p-6 text-burgundy-500 overflow-y-auto">
      <div className="bg-butter rounded-2xl p-5 sm:p-8 w-full max-w-md border border-burgundy-500/20">
        <div className="text-center mb-8">
          <LockKeyhole size={40} strokeWidth={1.8} className="mx-auto mb-3 text-burgundy-500" />
          <h1 className="text-2xl font-bold text-burgundy-500">Secure Chat</h1>
          <p className="text-burgundy-400 text-sm mt-1">Masuk ke akun kamu</p>
        </div>

        {error && (
          <div className="bg-burgundy-500/10 border border-burgundy-500/30 text-burgundy-500 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Username atau Email</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500"
              placeholder="username"
              required
            />
          </div>
          <div>
            <label className="block text-burgundy-500 text-sm mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-butter text-burgundy-500 rounded-lg px-4 py-3 border border-burgundy-500/30 focus:outline-none focus:border-burgundy-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-burgundy-500 hover:bg-burgundy-400 disabled:bg-burgundy-600 text-butter font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-burgundy-400 text-sm mt-6">
          Belum punya akun?{' '}
          <Link to="/register" className="text-burgundy-500 hover:text-burgundy-400 font-bold">Daftar sekarang</Link>
        </p>
      </div>
    </div>
  )
}
