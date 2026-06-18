import { useEffect, useState } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { Inbox, FileText, Bell, CheckCheck } from 'lucide-react'

interface Notification {
  id: string; type: string; title: string; message: string
  timestamp: string; read: boolean; icon: string
}

const ICONS: Record<string, any> = { inbox: Inbox, 'file-text': FileText }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    api.get('/notifications').then(res => setItems(res.data.notifications)).finally(() => setLoading(false))
  }, [])

  const markOne = (n: Notification) => {
    if (n.read) return
    setItems(prev => prev.map(i => (i.id === n.id ? { ...i, read: true } : i)))
    api.post(`/notifications/${n.id}/read`).catch(() => {})
  }

  const markAll = () => {
    setItems(prev => prev.map(i => ({ ...i, read: true })))
    api.post('/notifications/read-all').catch(() => {})
  }

  const unreadCount = items.filter(n => !n.read).length
  const filtered = filter === 'unread' ? items.filter(n => !n.read) : items

  return (
    <Layout title="Notifications" subtitle="Recent activity across your forms">
      <div className="space-y-5 animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {(['all', 'unread'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                {f} {f === 'unread' && unreadCount > 0 && <span className="ml-1 text-xs">({unreadCount})</span>}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAll} className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1.5"><CheckCheck className="w-4 h-4" /> Mark all read</button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="glass-card h-20 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">{filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n, i) => {
              const Icon = ICONS[n.icon] || Bell
              const read = n.read
              return (
                <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => markOne(n)}
                  className={`glass-card p-4 flex items-start gap-4 cursor-pointer hover:bg-white/[0.04] transition-colors ${!read ? 'border-l-2 border-l-primary-500' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.type === 'response' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary-500/15 text-primary-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${read ? 'text-slate-300' : 'text-white'}`}>{n.title}</p>
                      {!read && <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{n.message}</p>
                  </div>
                  <span className="text-xs text-slate-600 flex-shrink-0">{timeAgo(n.timestamp)}</span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
