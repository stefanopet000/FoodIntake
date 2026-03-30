const SEVERITY_CLASSES = {
  success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  info: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export default function Badge({ severity = 'info', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_CLASSES[severity]}`}>
      {children}
    </span>
  )
}
