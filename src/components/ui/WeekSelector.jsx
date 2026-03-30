import { useData } from '../../context/DataContext'

export default function WeekSelector() {
  const { weekLabels, selectedWeek, setSelectedWeek } = useData()

  if (weekLabels.length === 0) return null

  return (
    <div className="flex items-center gap-2 mb-4">
      <label className="text-sm text-slate-400">Week:</label>
      <select
        className="input text-sm"
        value={selectedWeek || ''}
        onChange={(e) => setSelectedWeek(e.target.value)}
      >
        {weekLabels.map((w) => (
          <option key={w} value={w}>{w}</option>
        ))}
      </select>
    </div>
  )
}
