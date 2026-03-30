export default function CSVPreviewTable({ rows, weekLabel }) {
  if (!rows || rows.length === 0) return null
  const keys = Object.keys(rows[0]).filter((k) => k !== 'week_label')
  const preview = rows.slice(0, 7)

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Preview — {weekLabel}</h3>
        <span className="text-xs text-slate-500">{rows.length} rows detected</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-700">
              {keys.map((k) => (
                <th key={k} className="pb-2 pr-4 text-slate-400 font-medium whitespace-nowrap">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className="border-b border-slate-700/50 last:border-0">
                {keys.map((k) => (
                  <td key={k} className="py-1.5 pr-4 text-slate-300 whitespace-nowrap">
                    {row[k] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
