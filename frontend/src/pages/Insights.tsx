import { useEffect, useState } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { InlineSpinner } from '../components/LoadingSpinner'
import {
  Sparkles, Smile, Meh, Frown, ThumbsUp, AlertTriangle,
  Hash, TrendingUp, Wand2, FileDown, Gauge,
} from 'lucide-react'

interface Insights {
  sentiment_score: number; positive_pct: number; neutral_pct: number; negative_pct: number
  total_analyzed: number; ratings_analyzed: number
  most_mentioned_topics: { topic: string; count: number }[]
  top_strengths: { title: string; avg_rating: number; responses: number }[]
  areas_for_improvement: { title: string; avg_rating: number; responses: number }[]
  form_breakdown: { form_id: number; title: string; avg_rating: number; responses: number }[]
}

export default function Insights() {
  const [data, setData] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    api.get('/insights/overview').then(res => setData(res.data.insights)).finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/insights/generate')
      setReport(res.data.report_markdown)
      toast.success('AI report generated!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'AI report unavailable. Add a Gemini API key to enable this.')
    } finally {
      setGenerating(false)
    }
  }

  const sentiment = [
    { label: 'Positive', pct: data?.positive_pct ?? 0, icon: Smile, color: 'text-emerald-400', bar: 'from-emerald-500 to-teal-500' },
    { label: 'Neutral', pct: data?.neutral_pct ?? 0, icon: Meh, color: 'text-amber-400', bar: 'from-amber-500 to-orange-500' },
    { label: 'Negative', pct: data?.negative_pct ?? 0, icon: Frown, color: 'text-rose-400', bar: 'from-rose-500 to-pink-500' },
  ]

  return (
    <Layout title="AI Insights" subtitle="Sentiment intelligence powered by Gemini Pro">
      <div className="space-y-6 animate-fade-in">
        {loading ? (
          <div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2 glass-card h-64 animate-pulse" /><div className="glass-card h-64 animate-pulse" /></div>
        ) : (
          <>
            {/* Hero: sentiment score + breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-card p-6 glow relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-4"><Gauge className="w-4 h-4 text-primary-400" /> Overall Sentiment</div>
                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-bold text-gradient">{data?.sentiment_score ?? 0}</span>
                    <span className="text-2xl text-slate-500 mb-2">/100</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-3">Based on {data?.ratings_analyzed ?? 0} rated answers across {data?.total_analyzed ?? 0} responses.</p>
                </div>
              </div>

              <div className="lg:col-span-2 glass-card p-6">
                <h2 className="font-semibold text-white mb-5">Sentiment Breakdown</h2>
                <div className="space-y-5">
                  {sentiment.map(s => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className={`flex items-center gap-2 ${s.color}`}><s.icon className="w-4 h-4" /> {s.label}</span>
                        <span className="text-white font-semibold">{s.pct}%</span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 0.6 }} className={`h-full bg-gradient-to-r ${s.bar} rounded-full`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths / improvements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-emerald-400" /> Top Strengths</h2>
                {data?.top_strengths.length ? (
                  <div className="space-y-3">
                    {data.top_strengths.map(s => (
                      <div key={s.title} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-sm text-slate-300 truncate">{s.title}</span>
                        <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> {s.avg_rating}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">Not enough rating data yet.</p>}
              </div>

              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Areas for Improvement</h2>
                {data?.areas_for_improvement.length ? (
                  <div className="space-y-3">
                    {data.areas_for_improvement.map(s => (
                      <div key={s.title} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <span className="text-sm text-slate-300 truncate">{s.title}</span>
                        <span className="text-sm font-semibold text-amber-400">{s.avg_rating}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">No low-rated areas — great work!</p>}
              </div>
            </div>

            {/* Most mentioned topics */}
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Hash className="w-4 h-4 text-primary-400" /> Most Mentioned Topics</h2>
              {data?.most_mentioned_topics.length ? (
                <div className="flex flex-wrap gap-2">
                  {data.most_mentioned_topics.map(t => (
                    <span key={t.topic} className="px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-sm text-primary-300">
                      {t.topic} <span className="text-primary-500/60">· {t.count}</span>
                    </span>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No categorical answers to analyze yet.</p>}
            </div>

            {/* AI report */}
            <div className="glass-card p-6 border border-primary-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-violet-500/5 pointer-events-none" />
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary-500/20 flex items-center justify-center"><Sparkles className="w-4 h-4 text-primary-400" /></div>
                    <div>
                      <h2 className="font-semibold text-white">AI Sentiment Report</h2>
                      <p className="text-xs text-slate-500">Full institutional analysis via Gemini Pro</p>
                    </div>
                  </div>
                  <button onClick={generate} disabled={generating} className="btn-primary">
                    {generating ? <InlineSpinner /> : <Wand2 className="w-4 h-4" />}
                    {generating ? 'Analyzing...' : report ? 'Regenerate' : 'Generate Report'}
                  </button>
                </div>

                {report ? (
                  <div className="prose prose-invert prose-sm max-w-none mt-4 p-5 bg-surface-950/50 rounded-xl border border-white/5">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    <FileDown className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                    <p className="text-sm">Generate a comprehensive AI-written report covering strengths, friction points, and recommended actions.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
