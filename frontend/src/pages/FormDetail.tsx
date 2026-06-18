import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { InlineSpinner } from '../components/LoadingSpinner'
import {
  Copy, ExternalLink, BarChart2, FileSpreadsheet, FileText,
  Mail, Calendar, ChevronLeft, Users, Search, Eye, Sparkles, X
} from 'lucide-react'

interface Response {
  id: number; form_id: number; user_email: string; submitted_at: string; answers: Record<string, any>
}
interface FormData {
  id: number; title: string; description: string; unique_link: string;
  is_active: boolean; schema: any[]; response_count: number; created_at: string
}

export default function FormDetail() {
  const { id } = useParams()
  const [form, setForm] = useState<FormData | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Response | null>(null)
  const [report, setReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  const generateReport = async () => {
    setGenerating(true)
    setShowReport(true)
    try {
      const res = await api.post(`/analytics/form/${id}/ai-report`)
      setReport(res.data.ai_insights_markdown)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'AI report unavailable. Add a Gemini API key to enable this.')
      setShowReport(false)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    api.get(`/forms/${id}`).then(res => {
      setForm(res.data.form)
      setResponses(res.data.responses)
    }).catch(() => toast.error('Failed to load form.')).finally(() => setLoading(false))
  }, [id])

  const copyLink = () => {
    if (!form) return
    navigator.clipboard.writeText(`${window.location.origin}${base}/form/${form.unique_link}`)
    toast.success('Link copied!')
  }

  const filtered = responses.filter(r => r.user_email.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <Layout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" /></div></Layout>
  if (!form) return <Layout><div className="text-center py-20 text-slate-500">Form not found.</div></Layout>

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <Link to="/" className="mt-1 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{form.title}</h1>
              <span className={form.is_active ? 'badge-active' : 'badge-inactive'}>
                <span className={`w-1.5 h-1.5 rounded-full ${form.is_active ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {form.description && <p className="text-slate-400 mt-1">{form.description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={copyLink} className="btn-ghost text-sm">
            <Copy className="w-4 h-4" />
            Copy Form Link
          </button>
          <a href={`${base}/form/${form.unique_link}`} target="_blank" rel="noreferrer" className="btn-ghost text-sm">
            <ExternalLink className="w-4 h-4" />
            Open Form
          </a>
          <Link to="/analytics" className="btn-ghost text-sm">
            <BarChart2 className="w-4 h-4" />
            Analytics
          </Link>
          <a href={`${base}/api/export/form/${id}/csv`} className="btn-ghost text-sm">
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </a>
          <a href={`${base}/api/export/form/${id}/pdf`} className="btn-ghost text-sm">
            <FileText className="w-4 h-4" />
            Export PDF
          </a>
          <button onClick={generateReport} disabled={generating || responses.length === 0} className="btn-primary text-sm">
            {generating ? <InlineSpinner /> : <Sparkles className="w-4 h-4" />}
            AI Report
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Responses', value: responses.length, icon: Users },
            { label: 'Form Fields', value: form.schema.length, icon: FileText },
            { label: 'Created', value: new Date(form.created_at).toLocaleDateString(), icon: Calendar },
          ].map((s) => (
            <div key={s.label} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card p-4">
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Public Form URL</p>
          <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/5 font-mono text-sm">
            <span className="text-primary-400 flex-1 truncate">{window.location.origin}{base}/form/{form.unique_link}</span>
            <button onClick={copyLink} className="text-slate-400 hover:text-white transition-colors"><Copy className="w-4 h-4" /></button>
            <a href={`${base}/form/${form.unique_link}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors"><ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="font-semibold text-white text-lg">Responses</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email..." className="input-field pl-9 py-2 text-sm w-60" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">{search ? 'No matching responses.' : 'No responses yet. Share your form link!'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="glass-card-hover p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary-300">
                    {r.user_email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />{r.user_email}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.submitted_at).toLocaleString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(r.answers).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="text-xs px-2 py-0.5 bg-white/5 rounded-md text-slate-400 border border-white/5">
                          <span className="text-slate-600">{k}:</span> {String(v).slice(0, 30)}
                        </span>
                      ))}
                      {Object.keys(r.answers).length > 3 && <span className="text-xs text-slate-600">+{Object.keys(r.answers).length - 3} more</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelected(selected?.id === r.id ? null : r)} className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="font-semibold text-white mb-1">{selected.user_email}</h3>
              <p className="text-xs text-slate-500 mb-4">{new Date(selected.submitted_at).toLocaleString()}</p>
              <div className="space-y-3">
                {form.schema.map(field => (
                  <div key={field.field_name} className="p-3 bg-white/3 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 mb-1">{field.field_label}</p>
                    <p className="text-sm text-white">{String(selected.answers[field.field_name] ?? '—')}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost w-full mt-4 justify-center">Close</button>
            </motion.div>
          </div>
        )}

        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowReport(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-surface-900/90 backdrop-blur-xl">
                <h3 className="font-semibold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-400" /> AI Sentiment Report</h3>
                <button onClick={() => setShowReport(false)} className="text-slate-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <InlineSpinner />
                    <p className="text-sm text-slate-500">Analyzing {responses.length} responses with Gemini Pro...</p>
                  </div>
                ) : report ? (
                  <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{report}</ReactMarkdown></div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-10">No report available.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  )
}
