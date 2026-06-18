import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Sparkles, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2, BarChart3, Wand2 } from 'lucide-react'
import { InlineSpinner } from '../components/LoadingSpinner'
import { motion } from 'framer-motion'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) { toast.error('Enter your username and password.'); return }
    setLoading(true)
    try {
      await login(username.trim(), password)
      toast.success('Welcome back, Amaan!')
      navigate('/')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-950 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Left marketing hero */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-16 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-lg leading-tight block">EduSentiAI</span>
            <span className="text-xs text-slate-500">Form Intelligence Platform</span>
          </div>
        </div>

        <div className="max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-4xl xl:text-5xl font-bold text-white leading-tight"
          >
            AI-Powered Forms &<br /><span className="text-gradient">Response Management</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-400 mt-5 text-lg"
          >
            Build intelligent forms in seconds, collect responses, and unlock instant sentiment analysis with Gemini Pro.
          </motion.p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Wand2, text: 'Generate forms from a single prompt' },
              { icon: BarChart3, text: 'Real-time analytics & response insights' },
              { icon: CheckCircle2, text: 'AI sentiment reports, PDF & CSV export' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-500/15 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-primary-400" />
                </div>
                <span className="text-slate-300">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2026 EduSentiAI · Crafted for educators</p>
      </div>

      {/* Right login card */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 glow">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">EduSentiAI</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm mb-8">Sign in to your admin dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Amaan J Sha"
                    autoFocus
                    autoComplete="username"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="input-field pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <InlineSpinner /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-slate-500 text-center">
                Are you a student?{' '}
                <Link to="/submissions" className="text-primary-400 hover:text-primary-300 transition-colors font-medium">
                  View your submissions
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
