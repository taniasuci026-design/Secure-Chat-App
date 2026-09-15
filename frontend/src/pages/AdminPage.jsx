import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    if (!user?.is_admin) { navigate('/chat'); return }
    loadStats()
    loadUsers()
    loadLogs()
  }, [])

  const loadStats = async () => {
    const res = await api.get('/admin/stats')
    setStats(res.data)
  }

  const loadUsers = async () => {
    const res = await api.get('/admin/users')
    setUsers(res.data)
  }

  const loadLogs = async () => {
    const res = await api.get('/admin/logs')
    setLogs(res.data)
  }

  const toggleActive = async (userId) => {
    await api.put(`/admin/users/${userId}/toggle-active`)
    loadUsers()
  }

  return (
    <div className="min-h-screen bg-pastel p-6 text-burgundy-500">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-burgundy-500">🛡 Admin Dashboard</h1>
          <button onClick={() => navigate('/chat')} className="text-burgundy-400 hover:text-burgundy-500 text-sm">← Kembali ke Chat</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['stats', 'users', 'logs'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-burgundy-500 text-butter' : 'bg-butter text-burgundy-500 hover:bg-burgundy-100'}`}>
              {t === 'stats' ? '📊 Statistik' : t === 'users' ? '👥 Users' : '📋 Logs'}
            </button>
          ))}
        </div>

        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: stats.total_users, icon: '👥' },
              { label: 'User Aktif', value: stats.active_users, icon: '✅' },
              { label: 'Total Pesan', value: stats.total_messages, icon: '💬' },
              { label: 'Activity Logs', value: stats.total_activity_logs, icon: '📋' },
            ].map(s => (
              <div key={s.label} className="bg-butter rounded-xl p-4 border border-burgundy-500/20">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-burgundy-500">{s.value}</div>
                <div className="text-burgundy-400 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-butter rounded-xl border border-burgundy-500/20 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-burgundy-500/10">
                <tr>
                  {['Username', 'Email', 'Status', 'Admin', 'Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-burgundy-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-burgundy-500/20 hover:bg-burgundy-500/10">
                    <td className="px-4 py-3 text-burgundy-500">{u.username}</td>
                    <td className="px-4 py-3 text-burgundy-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-burgundy-500/10 text-burgundy-500">
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-burgundy-400">{u.is_admin ? '✅' : '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(u.id)}
                        className="text-xs bg-burgundy-500 hover:bg-burgundy-400 text-butter px-3 py-1 rounded-lg transition-colors">
                        {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'logs' && (
          <div className="bg-butter rounded-xl border border-burgundy-500/20 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-burgundy-500/10">
                <tr>
                  {['Waktu', 'Aksi', 'Detail', 'IP'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-burgundy-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-t border-burgundy-500/20">
                    <td className="px-4 py-3 text-burgundy-400 text-xs">
                      {new Date(l.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        l.action.includes('FAILED') ? 'bg-burgundy-500/10 text-burgundy-500' :
                        l.action === 'LOGIN' ? 'bg-burgundy-500/10 text-burgundy-500' :
                        'bg-burgundy-500/10 text-burgundy-400'
                      }`}>{l.action}</span>
                    </td>
                    <td className="px-4 py-3 text-burgundy-400 text-xs">{l.detail}</td>
                    <td className="px-4 py-3 text-burgundy-400 text-xs">{l.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
