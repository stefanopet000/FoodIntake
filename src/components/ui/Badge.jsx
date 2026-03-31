const SEVERITY_CLASSES = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  info: 'bg-sky-50 text-sky-700 border border-sky-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
}

export default function Badge({ severity = 'info', children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_CLASSES[severity]}`}>
      {children}
    </span>
  )
}
