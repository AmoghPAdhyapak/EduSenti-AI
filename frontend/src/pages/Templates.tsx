import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { InlineSpinner } from '../components/LoadingSpinner'
import {
  GraduationCap, Calendar, BookOpen, Smile, Code, Users,
  FileText, Layers, ArrowRight, Plus,
} from 'lucide-react'

interface Template {
  key: string; title: string; description: string
  category: string; icon: string; field_count: number
}

const ICONS: Record<string, any> = {
  'graduation-cap': GraduationCap, calendar: Calendar, 'book-open': BookOpen,
  smile: Smile, code: Code, users: Users,
}
const CAT_COLORS: Record<string, string> = {
  Academic: 'from-primary-500 to-violet-600',
  Events: 'from-amber-500 to-orange-600',
  Survey: 'from-emerald-500 to-teal-600',
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [using, setUsing] = useState<string | null>(null)
  const [cat, setCat] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/templates').then(res => setTemplates(res.data.templates)).finally(() => setLoading(false))
  }, [])

  const useTemplate = async (key: string) => {
    setUsing(key)
    try {
      const res = await api.post(`/templates/${key}/use`)
      toast.success('Form created from template!')
      navigate(`/forms/${res.data.form.id}`)
    } catch {
      toast.error('Failed to create form from template.')
      setUsing(null)
    }
  }

  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))]
  const filtered = cat === 'All' ? templates : templates.filter(t => t.category === cat)

  return (
    <Layout title="Templates" subtitle="Start fast with ready-made form templates">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${cat === c ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="glass-card h-52 animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t, i) => {
              const Icon = ICONS[t.icon] || FileText
              return (
                <motion.div key={t.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card-hover p-5 flex flex-col group">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CAT_COLORS[t.category] || 'from-slate-500 to-slate-600'} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">{t.category}</span>
                  </div>
                  <h3 className="font-semibold text-white">{t.title}</h3>
                  <p className="text-sm text-slate-500 mt-1.5 flex-1 line-clamp-3">{t.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {t.field_count} fields</span>
                    <button onClick={() => useTemplate(t.key)} disabled={!!using}
                      className="text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1.5 disabled:opacity-50">
                      {using === t.key ? <InlineSpinner /> : <Plus className="w-4 h-4" />}
                      Use template <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
