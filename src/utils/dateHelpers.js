import { format, subWeeks, subMonths, parseISO, isValid } from 'date-fns'

export function getWeekLabel(dates) {
  const parsed = dates
    .map((d) => parseISO(d))
    .filter(isValid)
    .sort((a, b) => a - b)
  if (parsed.length === 0) return 'Unknown Week'
  return `${format(parsed[0], 'MMM d')}-${format(parsed[parsed.length - 1], 'd, yyyy')}`
}

export function isWeekend(day) {
  return day === 'Saturday' || day === 'Sunday'
}

export function sortByDate(rows) {
  return [...rows].sort((a, b) => new Date(a.date) - new Date(b.date))
}

export function getRangeStart(rangeKey) {
  const today = new Date()
  switch (rangeKey) {
    case '1w': return format(subWeeks(today, 1), 'yyyy-MM-dd')
    case '2w': return format(subWeeks(today, 2), 'yyyy-MM-dd')
    case '1m': return format(subMonths(today, 1), 'yyyy-MM-dd')
    default: return null
  }
}

export function formatDateLabel(dateStr) {
  try {
    return format(parseISO(dateStr), 'MMM d')
  } catch {
    return dateStr
  }
}
