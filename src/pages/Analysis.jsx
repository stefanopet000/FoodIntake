import { useData } from '../context/DataContext'
import { generateTips } from '../utils/analysisRules'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'

const SEVERITY_BORDER = {
  success: 'border-emerald-500/30',
  warning: 'border-amber-500/30',
  info: 'border-sky-500/30',
  danger: 'border-red-500/30',
}

export default function Analysis() {
  const { allData, isLoading } = useData()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const tips = generateTips(allData)

  if (tips.length === 0) {
    return (
      <div className="card text-center text-slate-400 py-16">
        <div className="text-4xl mb-3">🔍</div>
        <p>Not enough data yet to generate insights. Upload a few weeks of data.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card bg-slate-800/40">
        <p className="text-sm text-slate-400">
          <span className="text-slate-200 font-medium">Rule-based analysis</span> across all {allData.length} days of tracked data.
          These insights update automatically as you upload more weeks.
        </p>
      </div>
      {tips.map((tip) => (
        <div
          key={tip.id}
          className={`card border ${SEVERITY_BORDER[tip.severity]} space-y-2`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{tip.icon}</span>
              <h3 className="font-semibold text-slate-100">{tip.title}</h3>
            </div>
            <Badge severity={tip.severity}>{tip.severity}</Badge>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{tip.detail}</p>
        </div>
      ))}
    </div>
  )
}
