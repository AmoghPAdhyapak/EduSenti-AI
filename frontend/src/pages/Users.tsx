import { useEffect, useState } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { Search, Users as UsersIcon, Inbox, MapPin, FileText, Calendar } from 'lucide-react'

interface User {
  email: string; submissions: number; last_activity: string
  first_seen: string; location: string | null; forms_count: number
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/users').then(res => {
      setUsers(res.data.users)
      setTotal(res.data.total_users)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.location && u.location.toLowerCase().includes(search.toLowerCase()))
  )

  const totalSubmissions = users.reduce((s, u) => s + u.submissions, 0)
  const avgPerUser = total ? (totalSubmissions / total).toFixed(1) : '0'

  const stats = [
    { label: 'Total Respondents', value: total, icon: UsersIcon, color: 'from-primary-500 to-violet-600' },
    { label: 'Total Submissions', value: totalSubmissions, icon: Inbox, color: 'from-emerald-500 to-teal-600' },
    { label: 'Avg per User', value: avgPerUser, icon: FileText, color: 'from-amber-500 to-orange-600' },
  ]

  return (
    <Layout title="Users" subtitle="Everyone who submitted a response">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or location..." className="input-field pl-10" />
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Location</th>
                  <th className="px-5 py-3 font-medium">Submissions</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Forms</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">First Seen</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => <tr key={i} className="border-b border-white/5"><td colSpan={6} className="px-5 py-4"><div className="h-6 bg-white/5 rounded animate-pulse" /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center"><UsersIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" /><p className="text-slate-500">No users found.</p></td></tr>
                ) : filtered.map(u => (
                  <tr key={u.email} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-sm font-bold text-primary-300 flex-shrink-0">{u.email[0]?.toUpperCase()}</div>
                        <span className="text-white truncate max-w-[200px]">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-slate-400">{u.location ? <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-600" />{u.location}</span> : <span className="text-slate-600">—</span>}</td>
                    <td className="px-5 py-3"><span className="px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-300 text-xs font-semibold">{u.submissions}</span></td>
                    <td className="px-5 py-3 hidden sm:table-cell text-slate-400">{u.forms_count}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-slate-500 text-xs"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(u.first_seen).toLocaleDateString()}</span></td>
                    <td className="px-5 py-3 hidden lg:table-cell text-slate-500 text-xs">{new Date(u.last_activity).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}
