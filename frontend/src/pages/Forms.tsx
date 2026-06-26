import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  Plus, Search, FileText, Inbox, Copy, ExternalLink, BarChart3,
  Power, Trash2, Calendar, MoreVertical,
} from 'lucide-react'
import clsx from 'clsx'

interface Form {
  id: number; title: string; description: string; unique_link: string
  created_at: string; is_active: boolean; schema: any[]; response_count: number
}

export default function Forms() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [menuId, setMenuId] = useState<number | null>(null)

  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  const load = () => {
    api.get('/forms').then(res => setForms(res.data.forms)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${base}/form/${link}`)
    toast.success('Link copied!')
    setMenuId(null)
  }

  const toggle = async (id: number) => {
    try {
      const res = await api.post(`/forms/${id}/toggle`)
      setForms(prev => prev.map(f => f.id === id ? { ...f, is_active: res.data.is_active } : f))
      toast.success(res.data.message)
    } catch { toast.error('Failed to update form.') }
    setMenuId(null)
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this form and all its responses?')) return
    try {
      await api.delete(`/forms/${id}`)
      setForms(prev => prev.filter(f => f.id !== id))
      toast.success('Form deleted.')
    } catch { toast.error('Failed to delete form.') }
    setMenuId(null)
  }

  const filtered = forms.filter(f => {
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' ? f.is_active : !f.is_active)
    return matchSearch && matchFilter
  })

  return (
    <Layout title="Forms" subtitle="Create, manage and share your forms">
      <div className="space-y-6 animate-fade-in" onClick={() => setMenuId(null)}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search forms..." className="input-field pl-10" />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                  filter === f ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white')}>
                {f}
              </button>
            ))}
          </div>
          <Link to="/forms/new" className="btn-primary justify-center"><Plus className="w-4 h-4" /> Create Form</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="glass-card h-48 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 mb-1">{search || filter !== 'all' ? 'No matching forms.' : 'No forms yet.'}</p>
            <p className="text-sm text-slate-600 mb-5">Create your first form to start collecting responses.</p>
            <Link to="/forms/new" className="btn-primary inline-flex"><Plus className="w-4 h-4" /> Create Form</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((f, i) => (
              <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card-hover p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={f.is_active ? 'badge-active' : 'badge-inactive'}>
                      <span className={`w-1.5 h-1.5 rounded-full ${f.is_active ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                      {f.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setMenuId(menuId === f.id ? null : f.id)} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuId === f.id && (
                        <div className="absolute right-0 top-8 z-20 w-44 glass-card p-1.5 shadow-2xl">
                          <button onClick={() => copyLink(f.unique_link)} className="menu-item"><Copy className="w-4 h-4" /> Copy link</button>
                          <a href={`${base}/form/${f.unique_link}`} target="_blank" rel="noreferrer" className="menu-item"><ExternalLink className="w-4 h-4" /> Open form</a>
                          <button onClick={() => toggle(f.id)} className="menu-item"><Power className="w-4 h-4" /> {f.is_active ? 'Deactivate' : 'Activate'}</button>
                          <button onClick={() => remove(f.id)} className="menu-item text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Link to={`/forms/${f.id}`} className="flex-1">
                  <h3 className="font-semibold text-white hover:text-primary-300 transition-colors line-clamp-1">{f.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[40px]">{f.description || 'No description'}</p>
                </Link>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><Inbox className="w-3.5 h-3.5" /> {f.response_count} responses</span>
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {f.schema.length} fields</span>
                  <span className="flex items-center gap-1.5 ml-auto"><Calendar className="w-3.5 h-3.5" /> {new Date(f.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2 mt-3">
                  <Link to={`/forms/${f.id}`} className="btn-ghost flex-1 justify-center text-xs py-2">View</Link>
                  <Link to="/analytics" className="btn-ghost text-xs py-2 px-3"><BarChart3 className="w-3.5 h-3.5" /></Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
