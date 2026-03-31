export default function MetricCard({ label, value, sub, color = 'text-slate-800', icon }) {
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wider">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  )
}
