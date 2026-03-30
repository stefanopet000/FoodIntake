import { useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../../constants'

export default function TopBar({ onMenuClick }) {
  const location = useLocation()
  const current = NAV_ITEMS.find((n) =>
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  )

  return (
    <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
      <button
        onClick={onMenuClick}
        className="md:hidden text-slate-400 hover:text-slate-200 text-xl p-1"
        aria-label="Open menu"
      >
        ☰
      </button>
      <div className="flex items-center gap-2">
        {current && <span className="text-lg">{current.icon}</span>}
        <h1 className="text-base font-semibold text-slate-100">
          {current?.label || 'FoodTracker'}
        </h1>
      </div>
    </header>
  )
}
