import { useState, useEffect, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import { parseFoodDetailCSV } from '../services/foodDetailCsvParser'
import {
  fetchFoodDetailByDate,
  fetchFoodDetailRange,
  upsertFoodEntries,
  deleteMealEntries,
  deleteFoodEntry,
  findMealConflicts,
} from '../services/foodDetailService'
import BarChartCard from '../components/charts/BarChartCard'
import PieChartCard from '../components/charts/PieChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ReactMarkdown from 'react-markdown'

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'post_workout', 'pre_workout', 'other']
const UNITS = ['g', 'ml', 'piece', 'cup', 'tsp', 'tbsp', 'serving', 'slice', 'bowl']
const today = format(new Date(), 'yyyy-MM-dd')

function mealLabel(m) {
  return m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function makeEntryId(date, mealType, idx) {
  return `${date}-${mealType}-m${Date.now()}-${idx + 1}`
}

const emptyFormRow = () => ({ food_name_raw: '', quantity: '', unit: 'g', brand: '', preparation: '' })

// ─── AI Enrichment call ───────────────────────────────────────────────────────

async function enrichWithAI(payload) {
  const res = await fetch('/.netlify/functions/food-enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'AI enrichment failed')
  return json.entries
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function MacroRow({ label, value, color }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium text-slate-700">{value != null ? `${Number(value).toFixed(1)}g` : '—'}</span>
    </span>
  )
}

function MealTotals({ entries }) {
  const sum = (key) => entries.reduce((s, e) => s + (e[key] ?? 0), 0)
  return (
    <div className="flex flex-wrap gap-3 text-xs mt-2 pt-2 border-t border-slate-100">
      <span className="font-semibold text-slate-700">{Math.round(sum('kcal'))} kcal</span>
      <MacroRow label="P" value={sum('protein_g')} color="#60a5fa" />
      <MacroRow label="C" value={sum('carbs_g')}   color="#fbbf24" />
      <MacroRow label="F" value={sum('fat_g')}      color="#fb7185" />
      <MacroRow label="Fiber" value={sum('fiber_g')} color="#34d399" />
    </div>
  )
}

function ConfidenceBadge({ confidence }) {
  const colors = { high: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-red-100 text-red-600' }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[confidence] ?? 'bg-slate-100 text-slate-500'}`}>
      {confidence}
    </span>
  )
}

// ─── Tab: Log Food ─────────────────────────────────────────────────────────────

function LogFoodTab() {
  const [inputMode, setInputMode] = useState('text')
  const [logDate, setLogDate]   = useState(today)
  const [mealType, setMealType] = useState('breakfast')
  const [freeText, setFreeText] = useState('')
  const [formRows, setFormRows] = useState([emptyFormRow()])
  const [enriched, setEnriched] = useState([])        // enriched entries from AI
  const [clarifications, setClarifications] = useState({}) // {idx: answer}
  const [step, setStep] = useState('input')           // 'input' | 'clarify' | 'preview'
  const [enriching, setEnriching] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState(null)

  const needsClarification = enriched.filter((e) => e.clarification_needed)
  const allAnswered = needsClarification.every((_, i) => {
    const idx = enriched.findIndex((e) => e === needsClarification[i])
    return clarifications[idx]?.trim()
  })

  async function handleEnrich() {
    setEnriching(true)
    setError(null)
    try {
      let entries
      if (inputMode === 'text') {
        if (!freeText.trim()) return
        entries = await enrichWithAI({ mode: 'text', entries: [{ text: freeText, meal_type: mealType, date: logDate }] })
      } else {
        const valid = formRows.filter((r) => r.food_name_raw.trim())
        if (!valid.length) return
        entries = await enrichWithAI({ mode: 'form', entries: valid.map((r) => ({ ...r, meal_type: mealType, date: logDate })) })
      }
      setEnriched(entries)
      setStep(entries.some((e) => e.clarification_needed) ? 'clarify' : 'preview')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnriching(false)
    }
  }

  async function handleReEnrich() {
    setEnriching(true)
    setError(null)
    try {
      // Incorporate clarification answers into food_name_raw before re-enriching
      const updated = enriched.map((e, i) =>
        e.clarification_needed && clarifications[i]
          ? { ...e, food_name_raw: `${e.food_name_raw} (${clarifications[i]})`, clarification_needed: false }
          : e
      )
      const re = await enrichWithAI({ mode: 'form', entries: updated })
      setEnriched(re)
      setStep('preview')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnriching(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const toSave = enriched.map((e, i) => ({
        entry_id: makeEntryId(logDate, mealType, i),
        date: logDate,
        meal_type: mealType,
        food_name_raw:        e.food_name_raw,
        food_name_normalized: e.food_name_normalized ?? null,
        quantity:             e.quantity ?? null,
        unit:                 e.unit ?? null,
        grams_estimated:      e.grams_estimated ?? null,
        brand:                e.brand ?? null,
        preparation:          e.preparation ?? null,
        category_primary:     e.category_primary ?? null,
        category_secondary:   e.category_secondary ?? null,
        kcal:                 e.kcal ?? null,
        protein_g:            e.protein_g ?? null,
        carbs_g:              e.carbs_g ?? null,
        fat_g:                e.fat_g ?? null,
        fiber_g:              e.fiber_g ?? null,
        source_type:          e.source_type ?? null,
        confidence:           e.confidence ?? null,
        notes:                e.notes ?? null,
      }))
      await upsertFoodEntries(toSave)
      setSuccess(true)
      setStep('input')
      setEnriched([])
      setClarifications({})
      setFreeText('')
      setFormRows([emptyFormRow()])
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setStep('input')
    setEnriched([])
    setClarifications({})
    setError(null)
  }

  // ── Form row helpers ──
  function updateFormRow(idx, field, value) {
    setFormRows((rows) => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }
  function addFormRow() {
    setFormRows((rows) => [...rows, emptyFormRow()])
  }
  function removeFormRow(idx) {
    setFormRows((rows) => rows.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Date</label>
          <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)}
            className="input text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Meal</label>
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="input text-sm">
            {MEAL_TYPES.map((m) => <option key={m} value={m}>{mealLabel(m)}</option>)}
          </select>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          {[{ v: 'text', l: '✏️ Free text' }, { v: 'form', l: '📋 Structured' }].map(({ v, l }) => (
            <button key={v} onClick={() => { setInputMode(v); reset() }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${inputMode === v ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {success && (
        <div className="card bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          ✓ Food entries saved successfully!
        </div>
      )}
      {error && (
        <div className="card border border-red-200 text-red-600 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Step: Input ── */}
      {step === 'input' && (
        <div className="card space-y-3">
          {inputMode === 'text' ? (
            <>
              <label className="text-xs text-slate-400 block">
                Describe what you ate — one food or many (e.g. "2 fried eggs, 50g white bread, skyr 230g, small cappuccino")
              </label>
              <textarea
                className="input w-full text-sm leading-relaxed"
                rows={4}
                placeholder="2 scrambled eggs, 1 slice sourdough toast with butter, orange juice 200ml..."
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
              />
            </>
          ) : (
            <>
              <label className="text-xs text-slate-400 block">Add each food item separately</label>
              <div className="space-y-2">
                {formRows.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center flex-wrap">
                    <input className="input text-sm flex-1 min-w-[160px]" placeholder="Food name"
                      value={row.food_name_raw} onChange={(e) => updateFormRow(idx, 'food_name_raw', e.target.value)} />
                    <input className="input text-sm w-20" placeholder="Qty" type="number" min="0"
                      value={row.quantity} onChange={(e) => updateFormRow(idx, 'quantity', e.target.value)} />
                    <select className="input text-sm w-24"
                      value={row.unit} onChange={(e) => updateFormRow(idx, 'unit', e.target.value)}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input className="input text-sm w-28" placeholder="Brand (opt)"
                      value={row.brand} onChange={(e) => updateFormRow(idx, 'brand', e.target.value)} />
                    <input className="input text-sm w-28" placeholder="Prep (opt)"
                      value={row.preparation} onChange={(e) => updateFormRow(idx, 'preparation', e.target.value)} />
                    {formRows.length > 1 && (
                      <button onClick={() => removeFormRow(idx)} className="text-slate-300 hover:text-red-400 text-lg leading-none">×</button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addFormRow} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                + Add another food
              </button>
            </>
          )}
          <button onClick={handleEnrich} disabled={enriching || (inputMode === 'text' ? !freeText.trim() : !formRows.some((r) => r.food_name_raw.trim()))}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {enriching ? '⏳ Analyzing...' : '🤖 Analyze with AI'}
          </button>
          {enriching && <LoadingSpinner text="AI is identifying and enriching food entries..." />}
        </div>
      )}

      {/* ── Step: Clarify ── */}
      {step === 'clarify' && (
        <div className="card space-y-4">
          <p className="text-sm font-semibold text-amber-700">⚠️ A few items need clarification before we can estimate accurately:</p>
          <div className="space-y-3">
            {enriched.map((e, i) =>
              e.clarification_needed ? (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    <span className="text-amber-600 mr-1">❓</span>
                    {e.food_name_raw}: <span className="font-normal text-slate-500">{e.clarification_question}</span>
                  </p>
                  <input
                    className="input text-sm w-full"
                    placeholder="Your answer..."
                    value={clarifications[i] ?? ''}
                    onChange={(ev) => setClarifications((c) => ({ ...c, [i]: ev.target.value }))}
                  />
                </div>
              ) : (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="text-emerald-500">✓</span>
                  <span>{e.food_name_raw}</span>
                  <span className="text-slate-300">—</span>
                  <span>{e.kcal != null ? `${Math.round(e.kcal)} kcal` : '—'}</span>
                </div>
              )
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleReEnrich} disabled={enriching || !allAnswered}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {enriching ? '⏳ Re-analyzing...' : '→ Continue with answers'}
            </button>
            <button onClick={reset} className="btn-secondary">Start over</button>
          </div>
          {enriching && <LoadingSpinner text="Re-analyzing with your answers..." />}
        </div>
      )}

      {/* ── Step: Preview ── */}
      {step === 'preview' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              Preview — {mealLabel(mealType)} on {logDate}
            </h3>
            <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600">← Edit</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  <th className="pb-2 font-medium pr-4">Food</th>
                  <th className="pb-2 font-medium pr-3">Qty</th>
                  <th className="pb-2 font-medium pr-3">kcal</th>
                  <th className="pb-2 font-medium pr-3">Protein</th>
                  <th className="pb-2 font-medium pr-3">Carbs</th>
                  <th className="pb-2 font-medium pr-3">Fat</th>
                  <th className="pb-2 font-medium pr-3">Fiber</th>
                  <th className="pb-2 font-medium">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {enriched.map((e, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-4 font-medium text-slate-700">{e.food_name_raw}</td>
                    <td className="py-1.5 pr-3 text-slate-500">{e.quantity} {e.unit}</td>
                    <td className="py-1.5 pr-3 font-semibold">{e.kcal != null ? Math.round(e.kcal) : '—'}</td>
                    <td className="py-1.5 pr-3">{e.protein_g != null ? `${Number(e.protein_g).toFixed(1)}g` : '—'}</td>
                    <td className="py-1.5 pr-3">{e.carbs_g   != null ? `${Number(e.carbs_g).toFixed(1)}g`   : '—'}</td>
                    <td className="py-1.5 pr-3">{e.fat_g     != null ? `${Number(e.fat_g).toFixed(1)}g`     : '—'}</td>
                    <td className="py-1.5 pr-3">{e.fiber_g   != null ? `${Number(e.fiber_g).toFixed(1)}g`   : '—'}</td>
                    <td className="py-1.5"><ConfidenceBadge confidence={e.confidence} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <MealTotals entries={enriched} />

          {enriched.some((e) => e.notes) && (
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-slate-600">Show AI notes</summary>
              <ul className="mt-1 space-y-0.5 pl-3">
                {enriched.filter((e) => e.notes).map((e, i) => (
                  <li key={i}><span className="text-slate-600">{e.food_name_raw}:</span> {e.notes}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? '⏳ Saving...' : '✓ Save to Food Log'}
            </button>
            <button onClick={reset} className="btn-secondary">Discard</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Upload CSV ──────────────────────────────────────────────────────────

function UploadTab() {
  const [parsedRows,       setParsedRows]       = useState([])
  const [parseErrors,      setParseErrors]      = useState([])
  const [conflicts,        setConflicts]        = useState([]) // [{date,meal_type,existing,incoming}]
  const [choices,          setChoices]          = useState({}) // {`date__meal`: 'keep'|'replace'}
  const [uploadStep,       setUploadStep]       = useState('drop') // 'drop'|'preview'|'conflicts'|'done'
  const [uploading,        setUploading]        = useState(false)
  const [uploadSummary,    setUploadSummary]    = useState(null)
  const [error,            setError]            = useState(null)
  const [isDragging,       setIsDragging]       = useState(false)

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please select a .csv file')
      return
    }
    setError(null)
    const { data, errors } = await parseFoodDetailCSV(file)
    setParsedRows(data)
    setParseErrors(errors)
    setUploadStep('preview')
  }

  async function handleCheckConflicts() {
    setUploading(true)
    setError(null)
    try {
      const found = await findMealConflicts(parsedRows)
      setConflicts(found)
      const initialChoices = {}
      found.forEach(({ date, meal_type }) => {
        initialChoices[`${date}__${meal_type}`] = 'replace'
      })
      setChoices(initialChoices)
      setUploadStep(found.length > 0 ? 'conflicts' : 'uploading')
      if (found.length === 0) await doUpload(parsedRows)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function doUpload(rows) {
    setUploading(true)
    try {
      await upsertFoodEntries(rows)
      setUploadSummary({ count: rows.length })
      setUploadStep('done')
      setParsedRows([])
      setConflicts([])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleResolveAndUpload() {
    // For meals the user chose 'replace', delete existing first then upsert
    // For meals the user chose 'keep', exclude those rows from the upload
    setUploading(true)
    setError(null)
    try {
      for (const { date, meal_type } of conflicts) {
        if (choices[`${date}__${meal_type}`] === 'replace') {
          await deleteMealEntries(date, meal_type)
        }
      }
      const conflictKeys = new Set(conflicts.map((c) => `${c.date}__${c.meal_type}`))
      const toUpload = parsedRows.filter((r) => {
        const key = `${r.date}__${r.meal_type}`
        if (!conflictKeys.has(key)) return true
        return choices[key] === 'replace'
      })
      await doUpload(toUpload)
    } catch (err) {
      setError(err.message)
      setUploading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function reset() {
    setParsedRows([]); setParseErrors([]); setConflicts([]); setChoices({})
    setUploadStep('drop'); setUploadSummary(null); setError(null)
  }

  return (
    <div className="space-y-4">
      {error && <div className="card border border-red-200 text-red-600 text-sm"><strong>Error:</strong> {error}</div>}

      {uploadStep === 'done' && (
        <div className="card bg-emerald-50 border border-emerald-200 space-y-2">
          <p className="text-emerald-700 font-semibold">✓ Upload complete</p>
          <p className="text-emerald-600 text-sm">{uploadSummary?.count} entries saved to the food log.</p>
          <button onClick={reset} className="btn-secondary text-sm">Upload another file</button>
        </div>
      )}

      {/* Drop zone */}
      {uploadStep === 'drop' && (
        <div
          className={`card flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed transition-colors cursor-pointer ${isDragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('food-csv-input').click()}
        >
          <span className="text-3xl">📂</span>
          <p className="text-sm text-slate-500 text-center">
            Drag & drop your food intake CSV here<br />
            <span className="text-xs text-slate-400">or click to browse</span>
          </p>
          <input id="food-csv-input" type="file" accept=".csv" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Preview */}
      {uploadStep === 'preview' && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{parsedRows.length} valid rows parsed</h3>
            <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600">← Back</button>
          </div>
          {parseErrors.length > 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 space-y-0.5">
              {parseErrors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400">
                  {['Date', 'Meal', 'Food', 'Qty', 'Unit', 'kcal', 'P', 'C', 'F'].map((h) => (
                    <th key={h} className="pb-1.5 pr-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {parsedRows.map((r, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-3">{r.date}</td>
                    <td className="py-1 pr-3">{mealLabel(r.meal_type)}</td>
                    <td className="py-1 pr-3 max-w-[140px] truncate font-medium text-slate-700">{r.food_name_raw}</td>
                    <td className="py-1 pr-3">{r.quantity}</td>
                    <td className="py-1 pr-3">{r.unit}</td>
                    <td className="py-1 pr-3">{r.kcal != null ? Math.round(r.kcal) : '—'}</td>
                    <td className="py-1 pr-3">{r.protein_g != null ? `${r.protein_g}g` : '—'}</td>
                    <td className="py-1 pr-3">{r.carbs_g   != null ? `${r.carbs_g}g`   : '—'}</td>
                    <td className="py-1 pr-3">{r.fat_g     != null ? `${r.fat_g}g`     : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleCheckConflicts} disabled={uploading || parsedRows.length === 0}
            className="btn-primary disabled:opacity-50">
            {uploading ? '⏳ Checking...' : 'Check & Upload →'}
          </button>
        </div>
      )}

      {/* Conflict resolution */}
      {uploadStep === 'conflicts' && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 text-lg">⚠️</span>
            <h3 className="text-sm font-semibold text-slate-700">
              {conflicts.length} meal conflict{conflicts.length > 1 ? 's' : ''} found — choose which data to keep
            </h3>
          </div>

          {conflicts.map(({ date, meal_type, existing, incoming }) => {
            const key = `${date}__${meal_type}`
            const choice = choices[key] ?? 'replace'
            return (
              <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{date} — {mealLabel(meal_type)}</span>
                  <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden text-xs font-medium">
                    {['keep', 'replace'].map((opt) => (
                      <button key={opt}
                        onClick={() => setChoices((c) => ({ ...c, [key]: opt }))}
                        className={`px-3 py-1.5 transition-colors ${choice === opt ? (opt === 'keep' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700') : 'text-slate-400 hover:text-slate-600'}`}>
                        {opt === 'keep' ? '↩ Keep existing' : '↑ Use new data'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-100 text-xs">
                  <div className={`p-3 space-y-1 ${choice === 'keep' ? 'bg-sky-50' : ''}`}>
                    <p className="font-semibold text-slate-500 mb-2">Existing ({existing.length} items)</p>
                    {existing.map((e, i) => (
                      <div key={i} className="flex justify-between text-slate-600">
                        <span>{e.food_name_raw}</span>
                        <span className="text-slate-400">{e.kcal != null ? `${Math.round(e.kcal)} kcal` : '—'}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`p-3 space-y-1 ${choice === 'replace' ? 'bg-emerald-50' : ''}`}>
                    <p className="font-semibold text-slate-500 mb-2">From CSV ({incoming.length} items)</p>
                    {incoming.map((e, i) => (
                      <div key={i} className="flex justify-between text-slate-600">
                        <span>{e.food_name_raw}</span>
                        <span className="text-slate-400">{e.kcal != null ? `${Math.round(e.kcal)} kcal` : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex gap-2">
            <button onClick={handleResolveAndUpload} disabled={uploading} className="btn-primary disabled:opacity-50">
              {uploading ? '⏳ Uploading...' : '✓ Confirm & Upload'}
            </button>
            <button onClick={reset} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Browse ──────────────────────────────────────────────────────────────

function BrowseTab() {
  const [date,     setDate]     = useState(today)
  const [data,     setData]     = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchFoodDetailByDate(date))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])

  const byMeal = MEAL_TYPES.reduce((acc, m) => {
    acc[m] = data.filter((r) => r.meal_type === m)
    return acc
  }, {})

  const totalKcal    = data.reduce((s, r) => s + (r.kcal ?? 0), 0)
  const totalProtein = data.reduce((s, r) => s + (r.protein_g ?? 0), 0)
  const totalCarbs   = data.reduce((s, r) => s + (r.carbs_g ?? 0), 0)
  const totalFat     = data.reduce((s, r) => s + (r.fat_g ?? 0), 0)
  const totalFiber   = data.reduce((s, r) => s + (r.fiber_g ?? 0), 0)

  async function handleDelete(entryId) {
    setDeleting(entryId)
    try {
      await deleteFoodEntry(entryId)
      setData((d) => d.filter((r) => r.entry_id !== entryId))
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card flex items-end gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input text-sm" />
        </div>
        <button onClick={load} className="btn-secondary text-sm">Refresh</button>
      </div>

      {error && <div className="card border border-red-200 text-red-600 text-sm">{error}</div>}
      {loading && <LoadingSpinner />}

      {!loading && data.length === 0 && (
        <div className="card text-center text-slate-400 text-sm py-10">No food entries logged for {date}.</div>
      )}

      {!loading && data.length > 0 && (
        <>
          {/* Day totals */}
          <div className="card bg-slate-50 flex flex-wrap gap-4 text-sm">
            <div className="text-center">
              <p className="text-xs text-slate-400">Calories</p>
              <p className="text-xl font-bold text-slate-800">{Math.round(totalKcal)}</p>
            </div>
            {[
              { label: 'Protein', val: totalProtein, color: 'text-blue-500' },
              { label: 'Carbs',   val: totalCarbs,   color: 'text-amber-500' },
              { label: 'Fat',     val: totalFat,     color: 'text-rose-400' },
              { label: 'Fiber',   val: totalFiber,   color: 'text-emerald-500' },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-slate-400">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{Number(val).toFixed(1)}g</p>
              </div>
            ))}
          </div>

          {/* Per-meal sections */}
          {MEAL_TYPES.filter((m) => byMeal[m].length > 0).map((m) => (
            <div key={m} className="card space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">{mealLabel(m)}</h3>
              <div className="space-y-1">
                {byMeal[m].map((r) => (
                  <div key={r.entry_id} className="flex items-center gap-2 text-xs group">
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700">{r.food_name_raw}</span>
                      <span className="text-slate-400">{r.quantity} {r.unit}</span>
                      {r.kcal != null && <span className="text-slate-600 font-medium">{Math.round(r.kcal)} kcal</span>}
                      <MacroRow label="P" value={r.protein_g} color="#60a5fa" />
                      <MacroRow label="C" value={r.carbs_g}   color="#fbbf24" />
                      <MacroRow label="F" value={r.fat_g}     color="#fb7185" />
                      {r.confidence && <ConfidenceBadge confidence={r.confidence} />}
                    </div>
                    <button
                      onClick={() => { if (window.confirm(`Delete "${r.food_name_raw}"?`)) handleDelete(r.entry_id) }}
                      disabled={deleting === r.entry_id}
                      className="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none disabled:opacity-50">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <MealTotals entries={byMeal[m]} />
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ─── Tab: Analysis ────────────────────────────────────────────────────────────

function AnalysisTab() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'))
  const [endDate,   setEndDate]   = useState(today)
  const [data,      setData]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [dialog,    setDialog]    = useState([]) // [{speaker: 'Claude'|'ChatGPT'|'Conclusion', content}]
  const [analyzing, setAnalyzing] = useState(false)
  const [error,     setError]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchFoodDetailRange(startDate, endDate))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { load() }, [load])

  // Aggregate by date for charts
  const byDate = {}
  data.forEach((r) => {
    if (!byDate[r.date]) byDate[r.date] = { date: r.date, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
    byDate[r.date].kcal      += r.kcal      ?? 0
    byDate[r.date].protein_g += r.protein_g ?? 0
    byDate[r.date].carbs_g   += r.carbs_g   ?? 0
    byDate[r.date].fat_g     += r.fat_g     ?? 0
    byDate[r.date].fiber_g   += r.fiber_g   ?? 0
  })
  const dailyData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, kcal: Math.round(d.kcal), date: d.date.slice(5) })) // MM-DD for chart

  const totalP = data.reduce((s, r) => s + (r.protein_g ?? 0), 0)
  const totalC = data.reduce((s, r) => s + (r.carbs_g ?? 0), 0)
  const totalF = data.reduce((s, r) => s + (r.fat_g ?? 0), 0)
  const macroCalories = totalP * 4 + totalC * 4 + totalF * 9
  const macroPie = macroCalories > 0 ? [
    { name: 'Protein',      value: Math.round((totalP * 4 / macroCalories) * 100) },
    { name: 'Carbohydrates', value: Math.round((totalC * 4 / macroCalories) * 100) },
    { name: 'Fat',          value: Math.round((totalF * 9 / macroCalories) * 100) },
  ] : []

  // Calories by meal type
  const byMealType = {}
  data.forEach((r) => {
    byMealType[r.meal_type] = (byMealType[r.meal_type] ?? 0) + (r.kcal ?? 0)
  })
  const mealTypeData = Object.entries(byMealType)
    .map(([meal_type, kcal]) => ({ date: mealLabel(meal_type), kcal: Math.round(kcal) }))
    .sort((a, b) => b.kcal - a.kcal)

  async function handleAIAnalysis() {
    setAnalyzing(true)
    setDialog([])
    setError(null)
    const n = Object.keys(byDate).length
    const basePrompt = `You are reviewing ${n} days of detailed food intake data. The goal is to help this person lose weight sustainably while maintaining health and energy levels. Analyze their eating patterns, macro balance, meal timing, and food choices.`
    try {
      const accumulated = []
      for (let step = 1; step <= 5; step++) {
        const res = await fetch('/.netlify/functions/food-debate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, basePrompt, step, dialog: accumulated }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Analysis failed')
        accumulated.push(json.message)
        setDialog([...accumulated])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Date range */}
      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input text-sm" />
        </div>
        <button onClick={load} className="btn-secondary text-sm">Load</button>
      </div>

      {error && <div className="card border border-red-200 text-red-600 text-sm">{error}</div>}
      {loading && <LoadingSpinner />}

      {!loading && data.length === 0 && (
        <div className="card text-center text-slate-400 text-sm py-10">No food entries in this date range.</div>
      )}

      {!loading && data.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Days logged',   value: Object.keys(byDate).length, sub: 'with food data', color: 'text-slate-700' },
              { label: 'Avg daily kcal', value: Math.round(data.reduce((s, r) => s + (r.kcal ?? 0), 0) / Math.max(Object.keys(byDate).length, 1)), sub: 'kcal/day', color: 'text-sky-600' },
              { label: 'Avg protein',   value: `${(totalP / Math.max(Object.keys(byDate).length, 1)).toFixed(1)}g`, sub: 'per day', color: 'text-blue-500' },
              { label: 'Avg fiber',     value: `${(totalF / Math.max(Object.keys(byDate).length, 1)).toFixed(1)}g`, sub: 'per day', color: 'text-emerald-500' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="card text-center">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400">{sub}</p>
              </div>
            ))}
          </div>

          {dailyData.length > 1 && (
            <BarChartCard
              title="Daily calorie intake"
              data={dailyData}
              series={[{ key: 'kcal', label: 'kcal', color: '#38bdf8' }]}
              colorByValue={false}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {macroPie.length > 0 && (
              <PieChartCard
                title="Macro split (% of calories)"
                data={macroPie}
                colors={['#60a5fa', '#fbbf24', '#fb7185']}
              />
            )}
            {mealTypeData.length > 0 && (
              <BarChartCard
                title="Total calories by meal type"
                data={mealTypeData}
                series={[{ key: 'kcal', label: 'kcal', color: '#a78bfa' }]}
                colorByValue={false}
              />
            )}
          </div>

          {/* AI Debate Analysis */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">🤖 AI Expert Discussion</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Claude and ChatGPT debate your diet — {data.length} entries over {Object.keys(byDate).length} days
                </p>
              </div>
              <button onClick={handleAIAnalysis} disabled={analyzing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {analyzing ? '⏳ Running...' : '▶ Run Analysis'}
              </button>
            </div>

            {analyzing && (
              <div className="space-y-2">
                <LoadingSpinner text="Claude and ChatGPT are discussing your food data..." />
                <p className="text-xs text-slate-400 text-center">This takes ~30–45 seconds — 5 rounds of discussion</p>
              </div>
            )}

            {dialog.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-3">
                {dialog.map((turn, i) => {
                  if (turn.speaker === 'Conclusion') {
                    return (
                      <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">✅ Agreed Conclusion</p>
                        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                          <ReactMarkdown>{turn.content}</ReactMarkdown>
                        </div>
                      </div>
                    )
                  }
                  const isClaude = turn.speaker === 'Claude'
                  return (
                    <div key={i} className={`flex gap-3 ${isClaude ? '' : 'flex-row-reverse'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isClaude ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'}`}>
                        {isClaude ? 'C' : 'G'}
                      </div>
                      {/* Bubble */}
                      <div className={`flex-1 rounded-xl p-3 text-sm leading-relaxed ${isClaude ? 'bg-slate-50 border border-slate-200' : 'bg-sky-50 border border-sky-200'}`}>
                        <p className={`text-xs font-semibold mb-1.5 ${isClaude ? 'text-orange-500' : 'text-sky-600'}`}>
                          {turn.speaker}
                          <span className="font-normal text-slate-400 ml-2">Round {Math.floor(i / 2) + 1}</span>
                        </p>
                        <div className="prose prose-sm max-w-none text-slate-700">
                          <ReactMarkdown>{turn.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'log',      label: '✏️ Log Food'   },
  { id: 'upload',   label: '📂 Upload CSV' },
  { id: 'browse',   label: '📅 Browse'     },
  { id: 'analysis', label: '📊 Analysis'   },
]

export default function FoodLog() {
  const [activeTab, setActiveTab] = useState('log')

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'log'      && <LogFoodTab />}
      {activeTab === 'upload'   && <UploadTab />}
      {activeTab === 'browse'   && <BrowseTab />}
      {activeTab === 'analysis' && <AnalysisTab />}
    </div>
  )
}
