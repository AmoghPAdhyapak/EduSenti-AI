export default function LoadingSpinner({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="flex flex-col items-center gap-4">
        <div className={`${sizeMap[size]} border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin`} />
        <p className="text-slate-500 text-sm animate-pulse">Loading EduSentiAI...</p>
      </div>
    </div>
  )
}

export function InlineSpinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
}
