import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Sparkles, ChevronRight, ChevronLeft, CheckCircle2,
  Mail, AlertCircle
} from 'lucide-react'
import { InlineSpinner } from '../components/LoadingSpinner'
import clsx from 'clsx'

interface Field {
  field_name: string; field_label: string; field_type: string;
  is_required: boolean; options: string[] | null
}

interface FormData {
  id: number; title: string; description: string; unique_link: string; schema: Field[]
}

type Answers = Record<string, any>

export default function PublicForm() {
  const { uniqueLink } = useParams()
  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [email, setEmail] = useState('')
  const [questionIndex, setQuestionIndex] = useState(-1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/portal/form/${uniqueLink}`)
      .then(res => { setForm(res.data.form) })
      .catch(err => setError(err?.response?.data?.message || 'Form not found.'))
      .finally(() => setLoading(false))
  }, [uniqueLink])

  const currentField = form?.schema[questionIndex]
  const totalQuestions = form?.schema.length || 0
  const fillPercentage = questionIndex < 0 ? 0 : Math.round(((questionIndex + 1) / (totalQuestions + 1)) * 100)

  const validate = (): boolean => {
    if (questionIndex === -1) {
      if (!email.trim() || !email.includes('@')) {
        setFieldError('Please enter a valid email address.')
        return false
      }
      return true
    }
    if (!currentField) return true
    const val = answers[currentField.field_name]
    if (currentField.is_required && (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0))) {
      setFieldError('This question is required.')
      return false
    }
    return true
  }

  const goNext = () => {
    if (!validate()) return
    setFieldError(null)
    if (questionIndex === -1) {
      setQuestionIndex(0)
    } else if (questionIndex < totalQuestions - 1) {
      setQuestionIndex(i => i + 1)
    } else {
      handleSubmit()
    }
  }

  const goBack = () => {
    setFieldError(null)
    if (questionIndex === 0) setQuestionIndex(-1)
    else setQuestionIndex(i => i - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.post(`/portal/form/${uniqueLink}/submit`, { email, answers })
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const setAnswer = (fieldName: string, value: any) => {
    setFieldError(null)
    setAnswers(prev => ({ ...prev, [fieldName]: value }))
  }

  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="glass-card p-10 text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Form Unavailable</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center max-w-md glow">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-3">Response Submitted!</h2>
        <p className="text-slate-400 mb-2">Your response has been securely recorded.</p>
        <p className="text-sm text-slate-600 mb-8 flex items-center justify-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          {email}
        </p>
        <p className="text-xs text-slate-600">Powered by <span className="text-primary-500/70">EduSentiAI</span></p>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-950 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <motion.div className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full"
          animate={{ width: `${fillPercentage}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span className="text-slate-300 font-medium">EduSentiAI</span>
        </div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-xl">
          {questionIndex === -1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">{form?.title}</h1>
              {form?.description && <p className="text-slate-400">{form.description}</p>}
            </motion.div>
          )}

          {questionIndex >= 0 && (
            <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
              <span className="text-primary-400 font-semibold">{questionIndex + 1}</span>
              <span className="text-slate-700">/</span>
              <span>{totalQuestions}</span>
              <span className="ml-2">· {Math.round(fillPercentage)}% complete</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={questionIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {questionIndex === -1 && (
                <div className="glass-card p-8">
                  <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary-400" />
                    What's your email address?
                  </h2>
                  <p className="text-slate-500 text-sm mb-5">We'll use this to identify your submission.</p>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && goNext()}
                    placeholder="you@example.com" autoFocus
                    className="input-field text-lg py-4"
                  />
                </div>
              )}

              {questionIndex >= 0 && currentField && (
                <div className="glass-card p-8">
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {currentField.field_label}
                    {currentField.is_required && <span className="text-rose-400 ml-1">*</span>}
                  </h2>
                  <p className="text-sm text-slate-600 mb-5">
                    {currentField.field_type === 'rating' ? 'Select a rating from 1 to 5.' : currentField.is_required ? 'This question is required.' : 'Optional.'}
                  </p>
                  <QuestionInput field={currentField} value={answers[currentField.field_name]} onChange={v => setAnswer(currentField.field_name, v)} onEnter={goNext} />
                </div>
              )}

              {fieldError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {fieldError}
                </motion.div>
              )}

              <div className="flex items-center justify-between">
                <button onClick={goBack} className={clsx('btn-ghost', questionIndex === -1 && 'invisible')}>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <button onClick={goNext} disabled={submitting} className="btn-primary px-8 py-3">
                  {submitting ? <InlineSpinner /> : questionIndex === totalQuestions - 1 ? (
                    <><CheckCircle2 className="w-4 h-4" />Submit</>
                  ) : (
                    <>Continue <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-700">
        Powered by <span className="text-primary-600/60">EduSentiAI</span>
      </footer>
    </div>
  )
}

function QuestionInput({ field, value, onChange, onEnter }: {
  field: Field; value: any; onChange: (v: any) => void; onEnter: () => void
}) {
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && field.field_type !== 'paragraph') onEnter() }

  if (field.field_type === 'rating') {
    return (
      <div className="flex gap-3 flex-wrap">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={clsx(
              'w-14 h-14 rounded-2xl border-2 text-xl font-bold transition-all duration-200 flex items-center justify-center',
              value === n
                ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30 scale-110'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-primary-500/40 hover:text-white'
            )}>
            {n}
          </button>
        ))}
      </div>
    )
  }

  if (field.field_type === 'radio') {
    return (
      <div className="space-y-3">
        {field.options?.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={clsx(
              'w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200',
              value === opt
                ? 'bg-primary-500/20 border-primary-500 text-white'
                : 'bg-white/3 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
            )}>
            <div className="flex items-center gap-3">
              <div className={clsx('w-4 h-4 rounded-full border-2 flex items-center justify-center', value === opt ? 'border-primary-400' : 'border-slate-600')}>
                {value === opt && <div className="w-2 h-2 rounded-full bg-primary-400" />}
              </div>
              {opt}
            </div>
          </button>
        ))}
      </div>
    )
  }

  if (field.field_type === 'checkbox') {
    const selected: string[] = Array.isArray(value) ? value : []
    const toggle = (opt: string) => onChange(selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt])
    return (
      <div className="space-y-3">
        {field.options?.map(opt => (
          <button key={opt} onClick={() => toggle(opt)}
            className={clsx(
              'w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200',
              selected.includes(opt)
                ? 'bg-primary-500/20 border-primary-500 text-white'
                : 'bg-white/3 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
            )}>
            <div className="flex items-center gap-3">
              <div className={clsx('w-4 h-4 rounded border-2 flex items-center justify-center', selected.includes(opt) ? 'bg-primary-500 border-primary-500' : 'border-slate-600')}>
                {selected.includes(opt) && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              {opt}
            </div>
          </button>
        ))}
      </div>
    )
  }

  if (field.field_type === 'dropdown') {
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="input-field text-base py-4">
        <option value="" disabled>Select an option...</option>
        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )
  }

  if (field.field_type === 'paragraph') {
    return (
      <textarea value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder="Type your answer here..." rows={4}
        className="input-field resize-none text-base py-4" autoFocus />
    )
  }

  const inputType = field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'

  return (
    <input type={inputType} value={value || ''} onChange={e => onChange(e.target.value)}
      onKeyDown={handleKey}
      placeholder={field.field_type === 'email' ? 'name@example.com' : field.field_type === 'phone' ? '+1 (555) 000-0000' : 'Type your answer...'}
      className="input-field text-base py-4" autoFocus />
  )
}
