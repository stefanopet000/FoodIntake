import { Link } from 'react-router-dom'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="text-5xl">📭</div>
      <h3 className="text-lg font-semibold text-slate-200">No data yet</h3>
      <p className="text-sm text-slate-400 max-w-xs">
        Upload your first weekly CSV to start tracking your food intake and seeing trends.
      </p>
      <Link to="/upload" className="btn-primary">
        Upload CSV
      </Link>
    </div>
  )
}
