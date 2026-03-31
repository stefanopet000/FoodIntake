import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts'

// Returns a fill color based on deficit value thresholds.
// Positive = surplus (bad), negative = deficit (good up to a point).
export function deficitCellColor(val) {
  if (val == null) return '#94a3b8'
  if (val > 200)    return '#ef4444' // red         — significant surplus
  if (val > 0)      return '#f59e0b' // amber       — small surplus (1–200)
  if (val >= -100)  return '#86efac' // light green — minimal deficit (0 to −100)
  if (val >= -500)  return '#16a34a' // dark green  — optimal deficit (−100 to −500)
  if (val >= -750)  return '#86efac' // light green — moderate-high (−500 to −750)
  if (val >= -1000) return '#f59e0b' // amber       — high deficit (−750 to −1000)
  return '#ef4444'                   // red         — aggressive deficit (> −1000)
}

export default function BarChartCard({
  title, data, series, referenceY, colorByValue, getCellColor,
  stacked = false, height = 280,
}) {
  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#64748b' }}
            itemStyle={{ color: '#0f172a' }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ color: '#64748b', fontSize: 12 }} />}
          {referenceY != null && (
            <ReferenceLine y={referenceY} stroke="#cbd5e1" strokeDasharray="4 2" />
          )}
          {series.map((s, idx) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label || s.key}
              fill={s.color}
              stackId={stacked ? 'stack' : undefined}
              radius={stacked
                ? (idx === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0])
                : [4, 4, 0, 0]}
              animationDuration={800}
              maxBarSize={stacked ? 64 : 48}
            >
              {/* getCellColor: custom per-cell coloring (e.g. deficit thresholds) */}
              {getCellColor &&
                data.map((entry, i) => (
                  <Cell key={i} fill={getCellColor(entry[s.key])} />
                ))}
              {/* colorByValue: legacy green/red split at zero */}
              {!getCellColor && colorByValue &&
                data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry[s.key] != null && entry[s.key] >= 0 ? '#4ade80' : '#f87171'}
                  />
                ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
