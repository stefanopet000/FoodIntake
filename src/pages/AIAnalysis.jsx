import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { analyzeWithClaude, analyzeWithOpenAI, DEFAULT_PROMPT } from '../services/aiService'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import ReactMarkdown from 'react-markdown'

const CONTEXT_OPTIONS = [
  { value: 'all', label: 'All data' },
  { value: 'week', label: 'Current week' },
  { value: 'correlation', label: 'Correlation results' },
]

export default function AIAnalysis() {
  const { allData, filteredData, isLoading } = useData()
  const location = useLocation()
  const correlationState = location.state

  const [provider, setProvider] = useState('claude')
  const [context, setContext] = useState(correlationState?.context === 'correlation' ? 'correlation' : 'all')
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (correlationState?.context === 'correlation') {
      setPrompt(
        `You are a nutrition and fitness analyst. I have run a correlation analysis between "${correlationState.metricA}" and "${correlationState.metricB}".

The Pearson correlation coefficient is r = ${correlationState.pearsonR?.toFixed(3)}.
Interpretation: ${correlationState.interpretation}

Please interpret what this means for my health and fitness goals. Is this a meaningful relationship? What could be causing it? What should I focus on?`
      )
    } else {
      setPrompt(DEFAULT_PROMPT)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  function getDataForContext() {
    if (context === 'week') return filteredData
    if (context === 'correlation' && correlationState?.data) return correlationState.data
    return allData
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setError(null)
    setResult('')
    try {
      const data = getDataForContext()
      const fn = provider === 'claude' ? analyzeWithClaude : analyzeWithOpenAI
      const res = await fn(data, prompt)
      setResult(res.result)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Config card */}
      <div className="card space-y-4">
        {/* Provider toggle */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">AI Provider</label>
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1 w-fit">
            {[{ value: 'claude', label: '🟠 Claude' }, { value: 'openai', label: '🟢 ChatGPT' }].map((p) => (
              <button
                key={p.value}
                onClick={() => setProvider(p.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  provider === p.value
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Context */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Data context</label>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setContext(o.value)}
                disabled={o.value === 'correlation' && !correlationState}
                className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                  context === o.value
                    ? 'bg-slate-200 border-slate-300 text-slate-800'
                    : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Prompt (editable)</label>
          <textarea
            className="input w-full text-sm leading-relaxed"
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !prompt.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? '⏳ Analyzing...' : '🤖 Analyze'}
          </button>
          <span className="text-xs text-slate-500">
            {getDataForContext().length} rows will be sent
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card border border-red-500/30 text-red-400 text-sm">
          <strong>Error:</strong> {error}
          <p className="mt-1 text-xs text-slate-500">
            Make sure your API keys are set in Netlify environment variables: CLAUDE_API_KEY / OPENAI_API_KEY
          </p>
        </div>
      )}

      {/* Loading */}
      {analyzing && <LoadingSpinner text="Waiting for AI response..." />}

      {/* Result */}
      {result && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-600">
              {provider === 'claude' ? '🟠 Claude' : '🟢 ChatGPT'} Analysis
            </h3>
            <button onClick={handleCopy} className="btn-secondary text-xs py-1">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
