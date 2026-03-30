import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts'

export default function BarChartCard({
  title, data, series, referenceY, colorByValue, height = 280,
}) {
  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />}
          {referenceY != null && (
            <ReferenceLine y={referenceY} stroke="#475569" strokeDasharray="4 2" />
          )}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label || s.key}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              maxBarSize={48}
            >
              {colorByValue &&
                data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry[s.key] != null && entry[s.key] <= 0
                        ? '#4ade80'
                        : '#f87171'
                    }
                  />
                ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
