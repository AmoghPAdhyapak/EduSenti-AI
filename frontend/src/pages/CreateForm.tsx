import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Plus, Trash2, Save, ArrowRight, Wand2,
  ChevronUp, ChevronDown, CheckCircle2, GripVertical
} from 'lucide-react'
import { InlineSpinner } from '../components/LoadingSpinner'
import clsx from 'clsx'

interface Field {
  field_name: string; field_label: string; field_type: string;
  is_required: boolean; options: string[] | null
}

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'rating', label: 'Rating (1–5)' },
]

const needsOptions = (type: string) => ['dropdown', 'radio', 'checkbox'].includes(type)

function newField(): Field {
  return { field_name: `field_${Date.now()}`, field_label: '', field_type: 'text', is_required: true, options: null }
}

export default function CreateForm() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fields, setFields] = useState<Field[]>([newField()])
  const [prompt, setPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiSuccess, setAiSuccess] = useState(false)

  const handleAiGenerate = async () => {
    if (!prompt.trim()) { toast.error('Describe the form you need.'); return }
    setAiLoading(true); setAiSuccess(false)
    try {
      const res = await api.post('/forms/ai-generate', { prompt })
      const generated: Field[] = res.data.fields.map((f: any) => ({
        ...f,
        options: needsOptions(f.field_type) ? (f.options || ['Option 1', 'Option 2']) : null
      }))
      setFields(generated)
      setAiSuccess(true)
      toast.success(`Generated ${generated.length} fields!`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'AI generation failed.')
    } finally {
      setAiLoading(false)
    }
  }

  const updateField = (idx: number, updates: Partial<Field>) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== idx) return f
      const updated = { ...f, ...updates }
      if (updates.field_type) {
        updated.options = needsOptions(updates.field_type) ? (updated.options || ['Option 1', 'Option 2']) : null
      }
      if (updates.field_label !== undefined) {
        updated.field_name = updates.field_label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || `field_${i}`
      }
      return updated
    }))
  }

  const removeField = (idx: number) => setFields(prev => prev.filter((_, i) => i !== idx))
  const addField = () => setFields(prev => [...prev, newField()])
  const moveField = (idx: number, dir: -1 | 1) => {
    const arr = [...fields]
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= arr.length) return
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    setFields(arr)
  }

  const updateOption = (fIdx: number, oIdx: number, val: string) => {
    setFields(prev => prev.map((f, i) => {
      if (i !== fIdx || !f.options) return f
      const opts = [...f.options]; opts[oIdx] = val
      return { ...f, options: opts }
    }))
  }
  const addOption = (fIdx: number) => setFields(prev => prev.map((f, i) => i !== fIdx ? f : { ...f, options: [...(f.options || []), `Option ${(f.options?.length || 0) + 1}`] }))
  const removeOption = (fIdx: number, oIdx: number) => setFields(prev => prev.map((f, i) => i !== fIdx ? f : { ...f, options: f.options?.filter((_, oi) => oi !== oIdx) || [] }))

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Form title is required.'); return }
    const invalidField = fields.find(f => !f.field_label.trim())
    if (invalidField) { toast.error('All fields must have a label.'); return }
    setSaving(true)
    try {
      const res = await api.post('/forms', { title, description, schema: fields })
      toast.success('Form created!')
      navigate(`/forms/${res.data.form.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save form.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Create Form</h1>
            <p className="text-slate-400 mt-1">Design with AI or build manually.</p>
          </div>
          <button onClick={handleSave} disabled={saving || fields.length === 0} className="btn-primary">
            {saving ? <InlineSpinner /> : <Save className="w-4 h-4" />}
            Save Form
          </button>
        </div>

        <div className="glass-card p-6 border border-primary-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-violet-500/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-primary-400" />
              </div>
              <h2 className="font-semibold text-white">AI Form Generator</h2>
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full border border-primary-500/30">Gemini Pro</span>
            </div>
            <div className="flex gap-3">
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe your form... e.g. 'Create a student feedback form for a Web Development workshop with rating questions and open-ended feedback.'"
                rows={3}
                className="input-field flex-1 resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAiGenerate() }}
              />
              <button onClick={handleAiGenerate} disabled={aiLoading} className="btn-primary flex-shrink-0 self-end">
                {aiLoading ? <InlineSpinner /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? 'Generating...' : 'Generate'}
              </button>
            </div>
            {aiSuccess && (
              <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Fields generated! Review and edit below.
              </div>
            )}
            <p className="text-xs text-slate-600 mt-2">Tip: Ctrl+Enter to generate</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white">Form Details</h2>
          <div>
            <label className="label">Title <span className="text-rose-400">*</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Student Workshop Feedback 2026" className="input-field" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description shown to respondents..." rows={2} className="input-field resize-none" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Form Fields <span className="text-slate-500 text-sm font-normal ml-1">({fields.length})</span></h2>
            <button onClick={addField} className="btn-ghost text-sm py-2">
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>

          <AnimatePresence>
            {fields.map((field, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="glass-card p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 mt-1">
                    <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
                    <GripVertical className="w-4 h-4 text-slate-700" />
                    <button onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1} className="text-slate-600 hover:text-slate-300 disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="label">Question Label <span className="text-rose-400">*</span></label>
                        <input type="text" value={field.field_label} onChange={e => updateField(idx, { field_label: e.target.value })} placeholder="What's your question?" className="input-field" />
                        <p className="text-xs text-slate-600 mt-1">Key: <code className="text-primary-400/70">{field.field_name || '...'}</code></p>
                      </div>
                      <div className="w-44">
                        <label className="label">Field Type</label>
                        <select value={field.field_type} onChange={e => updateField(idx, { field_type: e.target.value })} className="input-field">
                          {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={field.is_required} onChange={e => updateField(idx, { is_required: e.target.checked })}
                        className="w-4 h-4 rounded accent-primary-500" />
                      <span className="text-sm text-slate-400">Required field</span>
                    </label>

                    {needsOptions(field.field_type) && (
                      <div className="space-y-2">
                        <label className="label">Options</label>
                        {field.options?.map((opt, oi) => (
                          <div key={oi} className="flex gap-2">
                            <input type="text" value={opt} onChange={e => updateOption(idx, oi, e.target.value)} placeholder={`Option ${oi + 1}`} className="input-field flex-1 py-2 text-sm" />
                            <button onClick={() => removeOption(idx, oi)} className="text-slate-600 hover:text-rose-400 transition-colors px-2"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => addOption(idx)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
                          <Plus className="w-3 h-3" />Add option
                        </button>
                      </div>
                    )}
                  </div>

                  <button onClick={() => removeField(idx)} disabled={fields.length === 1} className="text-slate-600 hover:text-rose-400 disabled:opacity-30 transition-colors mt-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={addField} className="w-full py-4 border-2 border-dashed border-white/10 hover:border-primary-500/40 text-slate-500 hover:text-primary-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Another Field
          </button>
        </div>

        <div className="flex justify-end pb-8">
          <button onClick={handleSave} disabled={saving || fields.length === 0} className="btn-primary px-8 py-3">
            {saving ? <InlineSpinner /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save & Generate Link'}
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </Layout>
  )
}
