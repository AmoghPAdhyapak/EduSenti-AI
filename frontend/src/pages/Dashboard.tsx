import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  FileText, Inbox, CheckCircle2, TrendingUp, TrendingDown,
  ArrowUpRight, Plus, Sparkles, BarChart3, Clock, Trophy,
} from 'lucide-react'

interface Stats {
  total_forms: number; active_forms: number; total_responses: number
  completion_rate: number; weekly_growth: number; responses_this_week: number
}
interface Activity { id: number; user_email: string; form_title: string; submitted_at: string; status: string }
interface TopForm { id: number; title: string; response_count: number }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [overview, setOverview] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] })
  const [topForms, setTopForms] = useState<TopForm[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats').then(res => {
      setStats(res.data.stats)
      setOverview(res.data.response_overview)
      setTopForms(res.data.top_performing_forms)
      setActivity(res.data.recent_activity)
    }).finally(() => setLoading(false))
  }, [])

  const chartData = overview.labels.map((label, i) => ({ label, responses: overview.data[i] }))
  const maxTop = Math.max(1, ...topForms.map(f => f.response_count))

  const cards = [
    { label: 'Total Forms', value: stats?.total_forms ?? 0, sub: `${stats?.active_forms ?? 0} active`, icon: FileText, color: 'from-primary-500 to-violet-600' },
    { label: 'Total Responses', value: stats?.total_responses ?? 0, sub: `${stats?.responses_this_week ?? 0} this week`, icon: Inbox, color: 'from-emerald-500 to-teal-600' },
    { label: 'Completion Rate', value: `${stats?.completion_rate ?? 0}%`, sub: 'of all responses', icon: CheckCircle2, color: 'from-amber-500 to-orange-600' },
    { label: 'Weekly Growth', value: `${(stats?.weekly_growth ?? 0) > 0 ? '+' : ''}${stats?.weekly_growth ?? 0}%`, sub: 'vs last week', icon: (stats?.weekly_growth ?? 0) >= 0 ? TrendingUp : TrendingDown, color: 'from-fuchsia-500 to-pink-600', trend: stats?.weekly_growth ?? 0 },
  ]

  return (
    <Layout title="Dashboard" subtitle="Welcome back, Amaan — here's your overview">
      {loading ? (
        <SkeletonGrid />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-5"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-lg`}>
                    <c.icon className="w-5 h-5 text-white" />
                  </div>
                  {'trend' in c && (
                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${(c.trend as number) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(c.trend as number) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-white mt-4">{c.value}</p>
                <p className="text-sm text-slate-400 mt-1">{c.label}</p>
                <p className="text-xs text-slate-600 mt-0.5">{c.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Response overview chart */}
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary-400" /> Responses Overview</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Last 14 days</p>
                </div>
                <Link to="/analytics" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">View all <ArrowUpRight className="w-3 h-3" /></Link>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13 }}
                      labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#a5b4fc' }}
                    />
                    <Area type="monotone" dataKey="responses" stroke="#818cf8" strokeWidth={2.5} fill="url(#respGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick actions + top forms */}
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Link to="/forms/new" className="btn-primary w-full justify-center"><Plus className="w-4 h-4" /> Create Form</Link>
                  <Link to="/insights" className="btn-ghost w-full justify-center"><Sparkles className="w-4 h-4" /> AI Insights</Link>
                  <Link to="/templates" className="btn-ghost w-full justify-center"><FileText className="w-4 h-4" /> Browse Templates</Link>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Top Forms</h2>
                <div className="space-y-4">
                  {topForms.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
                  {topForms.map((f, i) => (
                    <Link to={`/forms/${f.id}`} key={f.id} className="block group">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-slate-300 truncate group-hover:text-white transition-colors flex items-center gap-2">
                          <span className="text-xs text-slate-600 w-4">{i + 1}</span>{f.title}
                        </span>
                        <span className="text-slate-500 flex-shrink-0 ml-2">{f.response_count}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden ml-6">
                        <div className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full" style={{ width: `${(f.response_count / maxTop) * 100}%` }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-primary-400" /> Recent Activity</h2>
              <Link to="/responses" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">All responses <ArrowUpRight className="w-3 h-3" /></Link>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No responses yet.</p>
            ) : (
              <div className="space-y-1">
                {activity.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-sm font-bold text-primary-300 flex-shrink-0">
                      {a.user_email[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{a.user_email}</p>
                      <p className="text-xs text-slate-500 truncate">submitted to <span className="text-slate-400">{a.form_title}</span></p>
                    </div>
                    <span className={a.status === 'completed' ? 'badge-active' : 'badge-inactive'}>{a.status}</span>
                    <span className="text-xs text-slate-600 hidden sm:block flex-shrink-0">{new Date(a.submitted_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

function SkeletonGrid() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="glass-card h-32 animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card h-80 animate-pulse" />
        <div className="glass-card h-80 animate-pulse" />
      </div>
    </div>
  )
}
