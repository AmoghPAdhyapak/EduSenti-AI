import { ReactNode, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, FileText, Inbox, BarChart3, Sparkles,
  Users, LayoutTemplate, Bell, Settings as SettingsIcon,
  Menu, LogOut, Search, Crown, ChevronRight, X, ArrowLeft, RefreshCw, Sun, Moon,
} from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Forms', icon: FileText, path: '/forms' },
  { label: 'Responses', icon: Inbox, path: '/responses' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'AI Insights', icon: Sparkles, path: '/insights' },
  { label: 'Users', icon: Users, path: '/users' },
  { label: 'Templates', icon: LayoutTemplate, path: '/templates' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
  { label: 'Settings', icon: SettingsIcon, path: '/settings' },
]

export default function Layout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  title?: string
  subtitle?: string
}) {
  const { admin, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => window.location.reload(), 450)
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  useEffect(() => {
    api.get('/notifications').then(res => {
      setUnread(res.data.unread_count ?? 0)
    }).catch(() => {})
  }, [location.pathname])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === base + '/' || location.pathname === base
    return location.pathname.startsWith(base + path)
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-surface-950">
      {/* Ambient glow */}
      <div className="fixed top-0 left-64 w-[500px] h-[500px] bg-primary-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'bg-surface-900/70 backdrop-blur-xl border-r border-white/5'
      )}>
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-base leading-tight block">EduSentiAI</span>
              <span className="text-[11px] text-slate-500">Form Intelligence</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map(item => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20 shadow-lg shadow-primary-500/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                )}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.path === '/notifications' && unread > 0 && (
                  <span className="text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{unread}</span>
                )}
                {active && item.path !== '/notifications' && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              </Link>
            )
          })}
        </nav>

        {/* Upgrade card */}
        <div className="p-3">
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-primary-600/30 to-violet-600/20 border border-primary-500/20">
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary-500/30 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                <Crown className="w-4 h-4 text-amber-300" />
              </div>
              <p className="text-sm font-semibold text-white">Upgrade to Pro</p>
              <p className="text-[11px] text-slate-300/80 mt-1 mb-3">Unlock unlimited AI reports & exports.</p>
              <button className="w-full text-xs font-medium bg-white text-surface-950 rounded-lg py-2 hover:bg-slate-200 transition-colors">
                Upgrade now
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="flex items-center gap-4 px-4 lg:px-8 py-4 border-b border-white/5 bg-surface-950/60 backdrop-blur-xl sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(-1)}
              title="Go back"
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh data"
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={clsx('w-5 h-5', refreshing && 'animate-spin')} />
            </button>
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            {title && <h1 className="text-lg lg:text-xl font-bold text-white truncate">{title}</h1>}
            {subtitle && <p className="text-xs lg:text-sm text-slate-500 truncate">{subtitle}</p>}
          </div>

          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              placeholder="Search..."
              className="input-field pl-9 py-2 text-sm w-48 lg:w-56"
            />
          </div>

          <Link to="/notifications" className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-surface-950" />}
          </Link>

          <div className="flex items-center gap-3 pl-3 border-l border-white/5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-medium text-white truncate max-w-[140px]">{admin?.name}</p>
              <p className="text-[11px] text-slate-500 capitalize">{admin?.role || 'Administrator'}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
