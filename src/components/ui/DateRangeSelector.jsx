import { DATE_RANGES } from '../../constants'

export default function DateRangeSelector({ value, onChange, customStart, customEnd, onCustomChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex bg-slate-700 rounded-lg p-1 gap-1">
        {DATE_RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              value === r.value
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input text-sm"
            value={customStart}
            onChange={(e) => onCustomChange('start', e.target.value)}
          />
          <span className="text-slate-500 text-sm">to</span>
          <input
            type="date"
            className="input text-sm"
            value={customEnd}
            onChange={(e) => onCustomChange('end', e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
