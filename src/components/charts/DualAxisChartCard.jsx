import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { CHART_COLORS } from '../../constants'

export default function DualAxisChartCard({
  title, data, metricA, metricB, labelA, labelB, showTrend = false, height = 320,
}) {
  const colorA = CHART_COLORS.intake
  const colorB = CHART_COLORS.deficit

  return (
    <div className="card">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
          <YAxis
            yAxisId="left"
            tick={{ fill: colorA, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: colorB, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#64748b' }}
            itemStyle={{ color: '#0f172a' }}
          />
          <Legend wrapperStyle={{ color: '#64748b', fontSize: 12 }} />
          <ReferenceLine yAxisId="left" y={0} stroke="#cbd5e1" strokeDasharray="4 2" />

          <Line yAxisId="left" type="monotone" dataKey={metricA} name={labelA || metricA}
            stroke={colorA} strokeWidth={2} dot={{ r: 3, fill: colorA }} activeDot={{ r: 5 }} animationDuration={800} />
          <Line yAxisId="right" type="monotone" dataKey={metricB} name={labelB || metricB}
            stroke={colorB} strokeWidth={2} dot={{ r: 3, fill: colorB }} activeDot={{ r: 5 }} animationDuration={800} />

          {showTrend && (
            <>
              <Line yAxisId="left" type="monotone" dataKey="trendA" name={`${labelA || metricA} trend`}
                stroke={colorA} strokeWidth={1} strokeDasharray="5 3" dot={false} animationDuration={800} />
              <Line yAxisId="right" type="monotone" dataKey="trendB" name={`${labelB || metricB} trend`}
                stroke={colorB} strokeWidth={1} strokeDasharray="5 3" dot={false} animationDuration={800} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
