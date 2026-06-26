import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { InlineSpinner } from '../components/LoadingSpinner'
import { Search, FileText, Calendar, ChevronDown, GraduationCap, Inbox } from 'lucide-react'

interface Submission {
  response_id: number; form_title: string; submitted_at: string
  status: string; answers: Record<string, any>
}

export default function MySubmissions() {
  const [email, setEmail] = useState('')
  const [submissions, setSubmissions] = useState<Submission[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await api.get('/portal/history', { params: { email: email.trim() } })
      setSubmissions(res.data.submissions)
      setSearched(res.data.email)
    } catch {
      toast.error('Could not load submissions.')
      setSubmissions([])
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-surface-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
        <Link to="/login" className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">EduSentiAI</span>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="text-slate-400 mt-2">Enter your email to view your form submission history.</p>
        </div>

        <form onSubmit={lookup} className="glass-card p-2 flex gap-2 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
              className="w-full bg-transparent border-0 pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? <InlineSpinner /> : 'Search'}</button>
        </form>

        {submissions !== null && (
          <div className="mt-8 space-y-3 animate-fade-in">
            {submissions.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Inbox className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">No submissions found for <span className="text-white">{searched}</span>.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} for <span className="text-slate-300">{searched}</span></p>
                {submissions.map((s, i) => (
                  <motion.div key={s.response_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card overflow-hidden">
                    <button onClick={() => setOpenId(openId === s.response_id ? null : s.response_id)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-primary-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{s.form_title}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5"><Calendar className="w-3 h-3" />{new Date(s.submitted_at).toLocaleString()}</p>
                      </div>
                      <span className={s.status === 'completed' ? 'badge-active' : 'badge-inactive'}>{s.status}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openId === s.response_id ? 'rotate-180' : ''}`} />
                    </button>
                    {openId === s.response_id && (
                      <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                        {Object.entries(s.answers).map(([k, v]) => (
                          <div key={k} className="p-3 bg-white/[0.03] rounded-xl">
                            <p className="text-xs text-slate-500 mb-1 capitalize">{k.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-white break-words">{Array.isArray(v) ? v.join(', ') : String(v ?? '—')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
