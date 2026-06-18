import { useEffect, useState } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts'
import { Inbox, Activity, CheckCircle2, FileText, MapPin, Star } from 'lucide-react'
import clsx from 'clsx'

interface Overview {
  range_days: number
  summary: { total_responses: number; average_daily: number; completion_rate: number; active_forms: number }
  response_trends: { labels: string[]; data: number[] }
  responses_by_form: { title: string; count: number }[]
  rating_distribution: { labels: string[]; data: number[] }
  form_performance: { title: string; responses: number; completion: number; is_active: boolean }[]
  top_locations: { location: string; count: number; percent: number }[]
}

const RANGES = [7, 14, 30, 90]
const RATING_COLORS = ['#f43f5e', '#fb923c', '#facc15', '#a3e635', '#22c55e']

export default function Analytics() {
  const [data, setData] = useState<Overview | null>(null)
  const [range, setRange] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/analytics/overview', { params: { range } }).then(res => setData(res.data)).finally(() => setLoading(false))
  }, [range])

  const trends = data?.response_trends.labels.map((label, i) => ({ label, value: data.response_trends.data[i] })) || []
  const ratings = data?.rating_distribution.labels.map((label, i) => ({ label: label.replace(' Stars', '★').replace(' Star', '★'), value: data.rating_distribution.data[i] })) || []
  const byForm = data?.responses_by_form.slice(0, 6).map(f => ({ name: f.title, value: f.count })) || []

  const cards = [
    { label: 'Total Responses', value: data?.summary.total_responses ?? 0, icon: Inbox, color: 'from-primary-500 to-violet-600' },
    { label: 'Avg / Day', value: data?.summary.average_daily ?? 0, icon: Activity, color: 'from-emerald-500 to-teal-600' },
    { label: 'Completion Rate', value: `${data?.summary.completion_rate ?? 0}%`, icon: CheckCircle2, color: 'from-amber-500 to-orange-600' },
    { label: 'Active Forms', value: data?.summary.active_forms ?? 0, icon: FileText, color: 'from-fuchsia-500 to-pink-600' },
  ]

  return (
    <Layout title="Analytics" subtitle="Insights across all your forms">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-end gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit ml-auto">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                range === r ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white')}>
              {r}d
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="glass-card h-28 animate-pulse" />)}</div>
            <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 glass-card h-80 animate-pulse" /><div className="glass-card h-80 animate-pulse" /></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {cards.map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-lg mb-3`}>
                    <c.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{c.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6">
                <h2 className="font-semibold text-white mb-6">Response Trends</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={20} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#a5b4fc' }} />
                      <Area type="monotone" dataKey="value" name="Responses" stroke="#818cf8" strokeWidth={2.5} fill="url(#trendGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-6 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Rating Distribution</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratings} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="label" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13 }} labelStyle={{ color: '#94a3b8' }} />
                      <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                        {ratings.map((_, i) => <Cell key={i} fill={RATING_COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-6">Responses by Form</h2>
                {byForm.length === 0 ? <p className="text-sm text-slate-500">No data.</p> : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byForm} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={120} tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + '…' : v} />
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 13 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#a5b4fc' }} />
                        <Bar dataKey="value" name="Responses" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-6 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-400" /> Top Locations</h2>
                {(!data?.top_locations.length) ? <p className="text-sm text-slate-500">No location data.</p> : (
                  <div className="space-y-4">
                    {data.top_locations.map(loc => (
                      <div key={loc.location}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-slate-300">{loc.location}</span>
                          <span className="text-slate-500">{loc.count} <span className="text-slate-600">· {loc.percent}%</span></span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full" style={{ width: `${loc.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-6 pb-3"><h2 className="font-semibold text-white">Form Performance</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-3 font-medium">Form</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Responses</th>
                      <th className="px-6 py-3 font-medium w-1/3">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.form_performance.map(f => (
                      <tr key={f.title} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-6 py-3 text-white truncate max-w-[200px]">{f.title}</td>
                        <td className="px-6 py-3"><span className={f.is_active ? 'badge-active' : 'badge-inactive'}>{f.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td className="px-6 py-3 text-slate-400">{f.responses}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden max-w-[200px]">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${f.completion}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 w-10">{f.completion}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
