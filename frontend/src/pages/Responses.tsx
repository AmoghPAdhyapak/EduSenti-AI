import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  Search, Inbox, Eye, Trash2, Download, MapPin, Calendar,
  ChevronLeft, ChevronRight, X, Filter,
} from 'lucide-react'
import clsx from 'clsx'

interface RowItem {
  id: number; form_id: number; form_title: string; user_email: string
  submitted_at: string; location: string | null; status: string
}
interface Detail extends RowItem { answers: Record<string, any>; schema: any[] }
interface FormOpt { id: number; title: string }

export default function Responses() {
  const [rows, setRows] = useState<RowItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [search, setSearch] = useState('')
  const [formId, setFormId] = useState<number | ''>('')
  const [status, setStatus] = useState<'' | 'completed' | 'partial'>('')
  const [forms, setForms] = useState<FormOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Detail | null>(null)

  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  useEffect(() => {
    api.get('/forms').then(res => setForms(res.data.forms.map((f: any) => ({ id: f.id, title: f.title }))))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    const params: any = { page, per_page: perPage }
    if (search) params.search = search
    if (formId) params.form_id = formId
    if (status) params.status = status
    api.get('/responses', { params }).then(res => {
      setRows(res.data.responses)
      setTotal(res.data.total)
    }).finally(() => setLoading(false))
  }, [page, perPage, search, formId, status])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => { setPage(1) }, [search, formId, status])

  const view = async (id: number) => {
    try {
      const res = await api.get(`/responses/${id}`)
      setDetail(res.data.response)
    } catch { toast.error('Failed to load response.') }
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this response?')) return
    try {
      await api.delete(`/responses/${id}`)
      toast.success('Response deleted.')
      setDetail(null)
      load()
    } catch { toast.error('Failed to delete.') }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <Layout title="Responses" subtitle="Browse and manage all submitted responses">
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email, form or location..." className="input-field pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
            <select value={formId} onChange={e => setFormId(e.target.value ? Number(e.target.value) : '')} className="input-field py-2.5 w-auto min-w-[140px]">
              <option value="">All forms</option>
              {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="input-field py-2.5 w-auto">
              <option value="">All status</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
            </select>
            <a href={`${base}/api/responses/export`} className="btn-ghost py-2.5"><Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span></a>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Respondent</th>
                  <th className="px-5 py-3 font-medium">Form</th>
                  <th className="px-5 py-3 font-medium hidden md:table-cell">Location</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3 font-medium hidden lg:table-cell">Submitted</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={6} className="px-5 py-4"><div className="h-6 bg-white/5 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center">
                    <Inbox className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">No responses found.</p>
                  </td></tr>
                ) : rows.map(r => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/30 to-violet-500/30 flex items-center justify-center text-xs font-bold text-primary-300 flex-shrink-0">
                          {r.user_email[0]?.toUpperCase()}
                        </div>
                        <span className="text-white truncate max-w-[180px]">{r.user_email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 truncate max-w-[160px]">{r.form_title}</td>
                    <td className="px-5 py-3 hidden md:table-cell text-slate-400">
                      {r.location ? <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-600" /> {r.location}</span> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell"><span className={r.status === 'completed' ? 'badge-active' : 'badge-inactive'}>{r.status}</span></td>
                    <td className="px-5 py-3 hidden lg:table-cell text-slate-500 text-xs">{new Date(r.submitted_at).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => view(r.id)} className="p-2 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-white/5 transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => remove(r.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-xs text-slate-500">{total} total · page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-white/5 sticky top-0 bg-surface-900/90 backdrop-blur-xl">
              <div>
                <h3 className="font-semibold text-white">{detail.user_email}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{detail.form_title} · {new Date(detail.submitted_at).toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={detail.status === 'completed' ? 'badge-active' : 'badge-inactive'}>{detail.status}</span>
                  {detail.location && <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{detail.location}</span>}
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="text-slate-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              {detail.schema.map(field => {
                const val = detail.answers[field.field_name]
                return (
                  <div key={field.field_name} className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 mb-1">{field.field_label}</p>
                    <p className="text-sm text-white break-words">{Array.isArray(val) ? val.join(', ') : (val ?? '—')}</p>
                  </div>
                )
              })}
            </div>
            <div className="p-6 pt-0 flex gap-2">
              <button onClick={() => remove(detail.id)} className="btn-danger flex-1 justify-center"><Trash2 className="w-4 h-4" /> Delete</button>
              <button onClick={() => setDetail(null)} className="btn-ghost flex-1 justify-center">Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  )
}
