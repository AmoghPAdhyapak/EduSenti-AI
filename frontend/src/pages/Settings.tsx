import { useEffect, useState } from 'react'
import api from '../api/client'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { InlineSpinner } from '../components/LoadingSpinner'
import { User, Lock, Mail, Phone, Shield, Save, Palette, Sun, Moon } from 'lucide-react'

interface Profile { id: number; name: string; email: string; phone: string | null; role: string }

export default function Settings() {
  const { setAdmin } = useAuth()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [savingPass, setSavingPass] = useState(false)

  useEffect(() => {
    api.get('/settings/profile').then(res => {
      const p = res.data.profile
      setProfile(p); setName(p.name); setEmail(p.email); setPhone(p.phone || '')
    }).finally(() => setLoading(false))
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await api.put('/settings/profile', { name, email, phone })
      setProfile(res.data.profile)
      setAdmin(res.data.profile)
      toast.success('Profile updated.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile.')
    } finally { setSavingProfile(false) }
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirm) { toast.error('Passwords do not match.'); return }
    if (newPass.length < 6) { toast.error('New password must be at least 6 characters.'); return }
    setSavingPass(true)
    try {
      await api.put('/settings/password', { current_password: current, new_password: newPass })
      toast.success('Password updated.')
      setCurrent(''); setNewPass(''); setConfirm('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password.')
    } finally { setSavingPass(false) }
  }

  return (
    <Layout title="Settings" subtitle="Manage your account and security">
      <div className="max-w-3xl space-y-6 animate-fade-in">
        {loading ? (
          <><div className="glass-card h-64 animate-pulse" /><div className="glass-card h-56 animate-pulse" /></>
        ) : (
          <>
            {/* Profile card header */}
            <div className="glass-card p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {profile?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{profile?.name}</h2>
                <p className="text-sm text-slate-500">{profile?.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-xs px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20">
                  <Shield className="w-3 h-3" /> {profile?.role}
                </span>
              </div>
            </div>

            {/* Appearance */}
            <div className="glass-card p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2"><Palette className="w-4 h-4 text-primary-400" /> Appearance</h3>
                <p className="text-sm text-slate-500 mt-1">Choose how EduSentiAI looks. Your choice is saved on this device and stays after refresh.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {([
                  { id: 'dark', label: 'Dark Mode', desc: 'Sleek, low-light interface', icon: Moon },
                  { id: 'light', label: 'Light Mode', desc: 'Bright, premium SaaS look', icon: Sun },
                ] as const).map(opt => {
                  const Icon = opt.icon
                  const active = theme === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTheme(opt.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${active ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-300'}`}>{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                      </div>
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${active ? 'border-primary-500 bg-primary-500' : 'border-slate-600'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Profile form */}
            <form onSubmit={saveProfile} className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2"><User className="w-4 h-4 text-primary-400" /> Profile Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field pl-10" required />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" className="input-field pl-10" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={savingProfile} className="btn-primary">{savingProfile ? <InlineSpinner /> : <Save className="w-4 h-4" />} Save Changes</button>
              </div>
            </form>

            {/* Password form */}
            <form onSubmit={savePassword} className="glass-card p-6 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2"><Lock className="w-4 h-4 text-primary-400" /> Change Password</h3>
              <div>
                <label className="label">Current Password</label>
                <input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="input-field" required />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">New Password</label>
                  <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" required />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={savingPass} className="btn-primary">{savingPass ? <InlineSpinner /> : <Lock className="w-4 h-4" />} Update Password</button>
              </div>
            </form>
          </>
        )}
      </div>
    </Layout>
  )
}
