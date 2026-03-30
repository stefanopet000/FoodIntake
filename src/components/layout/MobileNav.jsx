import { NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { NAV_ITEMS } from '../../constants'

export default function MobileNav({ open, onClose }) {
  const location = useLocation()

  useEffect(() => {
    onClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-800 border-r border-slate-700 z-50 md:hidden flex flex-col">
        <div className="px-5 py-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <span className="text-sm font-bold text-slate-100">FoodTracker</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-xl">
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
